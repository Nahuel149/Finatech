const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const LogisticsOrder = require('../models/LogisticsOrder');
const LogisticsOrderEvent = require('../models/LogisticsOrderEvent');
const Transaction = require('../models/Transaction');
const SequenceCounter = require('../models/SequenceCounter');
const Client = require('../models/Client');
const User = require('../models/User');
const { storeEvidenceFiles } = require('../utils/evidenceStorage');
const { reserveCourierTransitBalance, applyReceptionBalances, computeReceptionTotals } = require('./treasury.service');
const { emitNotification } = require('./notifications.service');

const ORDER_PREFIX = 'OL';
const PROGRAM_ORDER_PERMISSIONS = ['manage-treasury', 'manage-operations', 'manage-logistics'];
const MIN_WINDOW_OFFSET_MINUTES = 30;
const ALLOCATABLE_STATUSES = ['BORRADOR', 'PROGRAMADA'];
const LOGISTICS_ACTIVE_STATUSES = ['PROGRAMADA', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO'];
const ROUTE_START_STATUSES = ['PROGRAMADA', 'ASIGNADA'];
const ROUTE_ARRIVAL_STATUSES = ['EN_CAMINO'];
const HANDOVER_ALLOWED_STATUSES = ['EN_SITIO'];
const COMPLETION_BLOCKED_STATUSES = ['DISCREPANCIA'];
const GEOFENCE_RADIUS_METERS = 150;
const ITEM_AMOUNT_TOLERANCE = 0.01;
const PRIORITY_SORT_ORDER = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};
const SEEDED_MESSENGERS = [
  { id: 'seed-mensajero-1', name: 'Mensajero demo 1' },
  { id: 'seed-mensajero-2', name: 'Mensajero demo 2' },
];

const shouldCreateTreasuryReception = (order) => {
  if (!order) {
    return false;
  }
  if (order.type === 'RETIRO') {
    return true;
  }
  if (order.type === 'ENTREGA') {
    const hasPending = Array.isArray(order.items)
      ? order.items.some((item) => {
          const pending = Number(item?.pendingAmount);
          if (Number.isFinite(pending) && pending > ITEM_AMOUNT_TOLERANCE) {
            return true;
          }
          const expected = Number(item?.expectedAmount) || 0;
          const received = Number(item?.receivedAmount ?? expected);
          return received + ITEM_AMOUNT_TOLERANCE < expected;
        })
      : false;
    return order.status === 'COMPLETADA_PARCIAL' || hasPending;
  }
  return false;
};

const ensureTreasuryReceptionPending = async (order, context = {}) => {
  if (!shouldCreateTreasuryReception(order) || order.treasuryReceptionStatus) {
    return;
  }
  order.treasuryReceptionStatus = 'pending';
  order.treasuryReception = order.treasuryReception || {};
  order.treasuryReception.closedWithoutAccountingImpact = false;
  if (!Array.isArray(order.treasuryReception.events)) {
    order.treasuryReception.events = [];
  }
  order.treasuryReception.events.push({
    type: 'recepcion.pendiente',
    user: context?.userId ? toObjectId(context.userId) : null,
    userName: context?.userName || context?.user?.fullName || context?.user?.email || null,
    createdAt: new Date(),
  });

  await reserveCourierTransitBalance(order, null, { userId: context?.userId || null });
};

const hasPermission = (user, permission) => {
  if (!permission) {
    return false;
  }
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((perm) => String(perm || '').toLowerCase())
    : [];
  return permissions.includes(permission.toLowerCase());
};

const canProgramOrder = (user) => PROGRAM_ORDER_PERMISSIONS.some((permission) => hasPermission(user, permission));

const roundAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const buildOrderRecipients = (order, fallbackUserId = null) => {
  const target = order?.assignedTo || fallbackUserId;
  if (!target) {
    return [];
  }
  const id =
    typeof target === 'object' && target.toString ? target.toString() : String(target || '').trim();
  return id ? [{ user: id }] : [];
};

const orderActionUrl = (orderId) => `/dashboard/logistica/orden/${orderId}`;

const notifyOrderEvent = (order, { title, message, severity = 'info', reason = null } = {}) => {
  if (!order?._id || !title || !message) {
    return;
  }
  const recipients = buildOrderRecipients(order);
  emitNotification({
    title,
    message,
    severity,
    actionLabel: 'Ver orden',
    actionUrl: orderActionUrl(order._id.toString()),
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber || null,
      status: order.status || null,
      type: order.type || null,
      operationCode: order.operationCode || null,
      assignedTo: order.assignedTo ? order.assignedTo.toString() : null,
      reason: reason || null,
    },
    recipients,
    context: {
      type: 'logistics_order',
      id: order._id.toString(),
      path: orderActionUrl(order._id.toString()),
    },
  });
};

const validateWindow = (windowStart, windowEnd, { requireFuture = true } = {}) => {
  const start = new Date(windowStart);
  const end = new Date(windowEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('La ventana horaria es invÃ¡lida.', 422);
  }

  if (start >= end) {
    throw new AppError('La hora de inicio debe ser anterior a la hora de fin.', 422);
  }

  if (requireFuture) {
    const minStart = Date.now() + MIN_WINDOW_OFFSET_MINUTES * 60 * 1000;
    if (start.getTime() < minStart) {
      throw new AppError(`La ventana debe comenzar al menos ${MIN_WINDOW_OFFSET_MINUTES} minutos en el futuro.`, 422);
    }
  }

  return { start, end };
};

const normalizeMetadata = (assetType, metadata = {}, index) => {
  if (assetType === 'CHEQUE') {
    const bank = normalizeString(metadata.bank);
    const number = normalizeString(metadata.number || metadata.checkNumber);
    const dueDate = metadata.dueDate ? new Date(metadata.dueDate) : null;
    if (!bank) {
      throw new AppError(`IndicÃ¡ el banco del cheque #${index + 1}.`, 422);
    }
    if (!number) {
      throw new AppError(`IndicÃ¡ el nÃºmero del cheque #${index + 1}.`, 422);
    }
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      throw new AppError(`IndicÃ¡ la fecha del cheque #${index + 1}.`, 422);
    }
    return {
      bank,
      number,
      dueDate,
      description: normalizeString(metadata.description) || null,
    };
  }

  if (assetType === 'METAL') {
    const metalType = normalizeString(metadata.metalType || metadata.type);
    const purity = normalizeString(metadata.purity);
    const weight = Number(metadata.weight);
    if (!metalType) {
      throw new AppError(`IndicÃ¡ el tipo de metal del Ã­tem #${index + 1}.`, 422);
    }
    if (!purity) {
      throw new AppError(`IndicÃ¡ la pureza del Ã­tem #${index + 1}.`, 422);
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new AppError(`IndicÃ¡ el peso del Ã­tem #${index + 1}.`, 422);
    }
    return {
      metalType,
      purity,
      weight,
      description: normalizeString(metadata.description) || null,
    };
  }

  if (assetType === 'OTHER') {
    const description = normalizeString(metadata.description);
    if (!description) {
      throw new AppError(`AgregÃ¡ una descripciÃ³n para el Ã­tem #${index + 1}.`, 422);
    }
    return { description };
  }

  return {
    description: normalizeString(metadata.description) || null,
  };
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || !items.length) {
    throw new AppError('DebÃ©s cargar al menos un Ã­tem de valor.', 422);
  }

  return items.map((item, index) => {
    const assetCode = normalizeString(item.assetCode || item.currency).toUpperCase();
    if (!assetCode) {
      throw new AppError(`SeleccionÃ¡ la divisa o activo para el Ã­tem #${index + 1}.`, 422);
    }

    const rawType = normalizeString(item.assetType || item.kind).toUpperCase();
    const assetType = ['CHEQUE', 'METAL', 'OTHER'].includes(rawType) ? rawType : 'CURRENCY';

    const expectedAmount = Number(item.expectedAmount);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      throw new AppError(`El monto esperado del Ã­tem #${index + 1} debe ser mayor a 0.`, 422);
    }

    return {
      assetCode,
      assetType,
      expectedAmount: roundAmount(expectedAmount),
      metadata: normalizeMetadata(assetType, item.metadata || {}, index),
      notes: normalizeString(item.notes) || null,
    };
  });
};

const buildOperationSnapshot = (transaction) => {
  if (!transaction) {
    return [];
  }

  const snapshot = [];
  if (transaction.incomingAsset?.code && Number.isFinite(Number(transaction.incomingAmount))) {
    snapshot.push({
      role: 'incoming',
      code: String(transaction.incomingAsset.code).toUpperCase(),
      label: transaction.incomingAsset.label,
      amount: Number(transaction.incomingAmount),
    });
  }

  if (transaction.outgoingAsset?.code && Number.isFinite(Number(transaction.outgoingAmount))) {
    const code = String(transaction.outgoingAsset.code).toUpperCase();
    const existing = snapshot.find((entry) => entry.code === code);
    if (existing) {
      existing.amount = roundAmount(existing.amount + Number(transaction.outgoingAmount));
    } else {
      snapshot.push({
        role: 'outgoing',
        code,
        label: transaction.outgoingAsset.label,
        amount: Number(transaction.outgoingAmount),
      });
    }
  }

  return snapshot;
};

const buildTotalsMap = (snapshot) => {
  const map = new Map();
  snapshot.forEach((entry) => {
    if (!entry || !entry.code) {
      return;
    }
    map.set(entry.code, {
      total: Number(entry.amount) || 0,
      label: entry.label,
      role: entry.role,
    });
  });
  return map;
};

const computeAllocatedAmounts = (orders = [], { excludeId } = {}) => {
  const allocated = new Map();
  orders.forEach((order) => {
    if (!order || !ALLOCATABLE_STATUSES.includes(order.status)) {
      return;
    }
    if (excludeId && order._id && order._id.toString() === excludeId.toString()) {
      return;
    }
    (order.items || []).forEach((item) => {
      if (!item || !item.assetCode) {
        return;
      }
      const code = String(item.assetCode).toUpperCase();
      const amount = Number(item.expectedAmount) || 0;
      if (!code || !Number.isFinite(amount)) {
        return;
      }
      const current = allocated.get(code) || 0;
      allocated.set(code, roundAmount(current + amount));
    });
  });
  return allocated;
};

const ensureCapacity = (items, totalsMap, allocated) => {
  const local = new Map();
  items.forEach((item) => {
    const entry = totalsMap.get(item.assetCode);
    if (!entry) {
      throw new AppError('El activo seleccionado no pertenece a la operaciÃ³n original.', 422);
    }
    const current = local.get(item.assetCode) || 0;
    local.set(item.assetCode, roundAmount(current + item.expectedAmount));
  });

  local.forEach((amount, code) => {
    const total = totalsMap.get(code)?.total || 0;
    const alreadyAllocated = allocated.get(code) || 0;
    if (amount + alreadyAllocated - total > 0.01) {
      throw new AppError('El monto esperado supera el saldo pendiente de la operaciÃ³n.', 422);
    }
  });
};

const computeBalances = (totalsMap, allocated) =>
  Array.from(totalsMap.entries()).map(([code, meta]) => {
    const allocatedAmount = allocated.get(code) || 0;
    const pendingAmount = Math.max(0, roundAmount(meta.total - allocatedAmount));
    return {
      assetCode: code,
      assetLabel: meta.label,
      role: meta.role,
      totalAmount: roundAmount(meta.total),
      allocatedAmount,
      pendingAmount,
    };
  });

const computeLiquidationPercentage = (orderType, items, transaction) => {
  if (!transaction) {
    return 0;
  }
  const referenceAsset = orderType === 'RETIRO'
    ? transaction.outgoingAsset?.code?.toUpperCase()
    : transaction.incomingAsset?.code?.toUpperCase();
  const referenceAmount = orderType === 'RETIRO'
    ? Number(transaction.outgoingAmount)
    : Number(transaction.incomingAmount);

  if (!referenceAsset || !Number.isFinite(referenceAmount) || referenceAmount <= 0) {
    return 0;
  }

  const covered = items
    .filter((item) => item.assetCode === referenceAsset)
    .reduce((sum, item) => sum + (Number(item.expectedAmount) || 0), 0);

  if (!covered) {
    return 0;
  }
  return Math.min(100, roundAmount((covered / referenceAmount) * 100));
};

const formatClientSnapshot = (client) => {
  if (!client) {
    return null;
  }
  return {
    id: client._id ? client._id.toString() : client.id || null,
    fullName: client.fullName || client.shortName || null,
    shortName: client.shortName || client.fullName || null,
    contactType: client.contactType || null,
    phone: client.phone || null,
    email: client.email || null,
  };
};

const formatClientAddress = (address, id, label) => {
  if (!address) {
    return null;
  }
  const formatted = address.formatted || address.description;
  if (!formatted) {
    return null;
  }
  return {
    id,
    label,
    formatted,
    placeId: address.placeId || null,
    latitude: Number.isFinite(address.latitude) ? address.latitude : null,
    longitude: Number.isFinite(address.longitude) ? address.longitude : null,
  };
};

const formatClientAddresses = (client) => {
  if (!client) {
    return [];
  }
  const addresses = [];
  const primary = formatClientAddress(client.primaryAddress, 'primary', 'Principal');
  const secondary = formatClientAddress(client.secondaryAddress, 'secondary', 'Secundario');
  if (primary) {
    addresses.push(primary);
  }
  if (secondary) {
    addresses.push(secondary);
  }
  return addresses;
};

const loadClientForLogistics = async (clientId) => {
  if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
    return { snapshot: null, addresses: [] };
  }
  const client = await Client.findById(clientId)
    .select('fullName shortName contactType phone email primaryAddress secondaryAddress')
    .lean();
  if (!client) {
    return { snapshot: null, addresses: [] };
  }
  return {
    snapshot: formatClientSnapshot(client),
    addresses: formatClientAddresses(client),
  };
};

const generateOrderNumber = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const counter = await SequenceCounter.findOneAndUpdate(
    { key: `${ORDER_PREFIX.toLowerCase()}-${year}` },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  const sequence = counter.value;
  const padded = String(sequence).padStart(6, '0');
  return {
    orderNumber: `${ORDER_PREFIX}-${year}-${padded}`,
    orderYear: year,
    orderSequence: sequence,
  };
};

const formatEvidence = (evidence) => {
  if (!evidence) {
    return null;
  }
  return {
    id: evidence._id?.toString() || undefined,
    type: evidence.type,
    url: evidence.url,
    createdAt: evidence.createdAt,
    metadata: evidence.metadata || {},
  };
};

const formatTimelineEvents = (events = []) =>
  events.map((event) => ({
    id: event._id?.toString() || undefined,
    type: event.type,
    title: event.title,
    description: event.description || null,
    metadata: event.metadata || null,
    createdAt: event.createdAt,
    createdBy: event.createdBy ? event.createdBy.toString() : null,
  }));

const formatOrder = (order, { timeline = [] } = {}) => {
  if (!order) {
    return null;
  }
  const doc = typeof order.toObject === 'function' ? order.toObject() : order;
  const resolvedTimeline = timeline.length ? timeline : doc.timeline || [];
  return {
    id: doc._id.toString(),
    operationId: doc.operationId?.toString() || null,
    operationCode: doc.operationCode,
    operationModel: doc.operationModel,
    operationType: doc.operationType || null,
    orderNumber: doc.orderNumber,
    status: doc.status,
    type: doc.type,
    origin: doc.origin,
    originAddressId: doc.originAddressId || null,
    destination: doc.destination,
    destinationAddressId: doc.destinationAddressId || null,
    windowStart: doc.windowStart,
    windowEnd: doc.windowEnd,
    contactName: doc.contactName,
    contactPhone: doc.contactPhone,
    messengerId: doc.messengerId ? doc.messengerId.toString() : null,
    messenger: doc.messenger || null,
    assignedTo: doc.assignedTo ? doc.assignedTo.toString() : null,
    priority: doc.priority || 'normal',
    notes: doc.notes || null,
    internalNotes: doc.internalNotes || null,
    items: (doc.items || []).map((item) => ({
      id: item._id?.toString() || undefined,
      assetCode: item.assetCode,
      assetType: item.assetType,
      expectedAmount: item.expectedAmount,
      metadata: item.metadata || {},
      notes: item.notes || null,
      receivedAmount: item.receivedAmount ?? null,
      pendingAmount: item.pendingAmount ?? null,
      discrepancyFlag: Boolean(item.discrepancyFlag),
      discrepancyReason: item.discrepancyReason || null,
    })),
    liquidationPercentage: doc.liquidationPercentage || 0,
    client: doc.clientSnapshot || null,
    operationSnapshot: doc.operationSnapshot || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy?.toString() || null,
    updatedBy: doc.updatedBy?.toString() || null,
    createdByName: doc.createdByName || null,
    updatedByName: doc.updatedByName || null,
    requiredEvidences: doc.requiredEvidences || [],
    evidences: (doc.evidences || []).map(formatEvidence).filter(Boolean),
    geofenceOK: Boolean(doc.geofenceOK),
    startedAt: doc.startedAt || null,
    arrivedAt: doc.arrivedAt || null,
    completedAt: doc.completedAt || null,
    receiptId: doc.receiptId || null,
    receiptUrl: doc.receiptUrl || null,
    timeline: formatTimelineEvents(resolvedTimeline),
  };
};

const toObjectId = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

const ensureAuthenticated = (context) => {
  const userId = context?.userId;
  if (!userId) {
    throw new AppError('AutenticaciÃ³n requerida.', 401);
  }
  return userId;
};

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  if (![lat1, lng1, lat2, lng2].every((value) => Number.isFinite(value))) {
    return null;
  }
  const R = 6371000; // meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getDestinationCoordinates = (order) => {
  if (!order) {
    return null;
  }
  if (
    Array.isArray(order.destinationLocation?.coordinates) &&
    order.destinationLocation.coordinates.length === 2
  ) {
    const [lng, lat] = order.destinationLocation.coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  if (Number.isFinite(order.destinationLat) && Number.isFinite(order.destinationLng)) {
    return { lat: order.destinationLat, lng: order.destinationLng };
  }
  if (
    Array.isArray(order.destinationCoords) &&
    order.destinationCoords.length === 2 &&
    Number.isFinite(order.destinationCoords[0]) &&
    Number.isFinite(order.destinationCoords[1])
  ) {
    return { lat: order.destinationCoords[1], lng: order.destinationCoords[0] };
  }
  return null;
};

const validateGeofenceDistance = (order, gpsLat, gpsLng) => {
  const coords = getDestinationCoordinates(order);
  if (!coords || !Number.isFinite(gpsLat) || !Number.isFinite(gpsLng)) {
    return {
      ok: true,
      distance: null,
    };
  }
  const distance = haversineDistance(coords.lat, coords.lng, gpsLat, gpsLng);
  if (distance === null) {
    return { ok: true, distance: null };
  }
  return {
    ok: distance <= GEOFENCE_RADIUS_METERS,
    distance,
  };
};

const recordTimelineEvent = async (order, { type, title, description = null, metadata = null }, context) => {
  if (!order?._id) {
    return null;
  }
  const event = await LogisticsOrderEvent.create({
    orderId: order._id,
    type,
    title,
    description,
    metadata,
    createdBy: context?.userId ? toObjectId(context.userId) : null,
  });
  return event;
};

const loadOrderTimeline = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return [];
  }
  const events = await LogisticsOrderEvent.find({ orderId }).sort({ createdAt: 1 }).lean();
  return events || [];
};

const generateLogisticsReceipt = (order) => {
  const timestamp = Date.now();
  const receiptId = `${order.orderNumber || order._id}-${timestamp}`;
  const receiptUrl = `/receipts/logistics/${receiptId}.pdf`;
  return {
    receiptId,
    receiptUrl,
  };
};

const ensureRequiredEvidences = (order) => {
  const missing = [];
  const evidencesByType = new Map();
  (order.evidences || []).forEach((evidence) => {
    if (!evidence?.type) {
      return;
    }
    const typeKey = evidence.type.toUpperCase();
    const group = evidencesByType.get(typeKey) || [];
    group.push(evidence);
    evidencesByType.set(typeKey, group);
  });

  (order.requiredEvidences || []).forEach((type) => {
    if (!type) {
      return;
    }
    if (!evidencesByType.has(type.toUpperCase())) {
      missing.push(type);
    }
  });

  if (missing.length) {
    throw new AppError(`Faltan evidencias obligatorias: ${missing.join(', ')}.`, 422, {
      missingEvidences: missing,
    });
  }
};

const ensureItemsWithinTolerance = (order) => {
  const invalidItems = [];
  (order.items || []).forEach((item) => {
    if (!item) {
      return;
    }
    const expected = Number(item.expectedAmount) || 0;
    const received = Number(item.receivedAmount);
    if (item.discrepancyFlag) {
      invalidItems.push(item.assetCode || item._id?.toString());
      return;
    }
    if (!Number.isFinite(received)) {
      invalidItems.push(item.assetCode || item._id?.toString());
      return;
    }
    const difference = Math.abs(expected - received);
    if (difference > ITEM_AMOUNT_TOLERANCE) {
      invalidItems.push(item.assetCode || item._id?.toString());
    }
  });

  if (invalidItems.length) {
    throw new AppError(
      'Los montos recibidos difieren de lo esperado. RevisÃ¡ los Ã­tems: ' + invalidItems.join(', '),
      422,
      { invalidItems }
    );
  }
};
const loadOrderForMessenger = async (orderId, userId, { includeTimeline = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Orden logística no encontrada.', 404);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('No tenés permisos para acceder a esta orden.', 403);
  }
  const order = await LogisticsOrder.findById(orderId);
  if (!order) {
    throw new AppError('Orden logística no encontrada.', 404);
  }
  if (order.assignedTo && order.assignedTo.toString() !== userId.toString()) {
    throw new AppError('Solo el logístico asignado puede operar esta orden.', 403);
  }
  const timeline = includeTimeline ? await loadOrderTimeline(order._id) : [];
  return { order, timeline };
};

const classifySettlementMedium = (method, defaultCurrency = 'ARS') => {
  const normalized = normalizeString(method).toLowerCase();
  let currency = String(defaultCurrency || 'ARS').toUpperCase();
  if (normalized.includes('usd') || normalized.includes('dolar') || normalized.includes('dolar')) {
    currency = 'USD';
  } else if (normalized.includes('ars') || normalized.includes('peso')) {
    currency = 'ARS';
  }
  let medium = 'transfer';
  if (normalized.includes('efectivo') || normalized.includes('cash')) {
    medium = 'cash';
  } else if (normalized.includes('transfer')) {
    medium = 'transfer';
  }
  return { currency, medium };
};

const inferSettlementMediums = async (order) => {
  if (!order?.operationId || !mongoose.Types.ObjectId.isValid(order.operationId)) {
    return {};
  }
  const transaction = await Transaction.findById(order.operationId).lean();
  if (!transaction || !transaction.settlement) {
    return {};
  }
  const defaultCurrency =
    transaction.type === 'buy'
      ? transaction.outgoingAsset?.code || transaction.outgoingAsset?.label || 'ARS'
      : transaction.incomingAsset?.code || transaction.incomingAsset?.label || 'ARS';

  const lines =
    transaction.settlement.mode === 'simple'
      ? [
          {
            method: transaction.settlement.simpleMethod || 'transfer',
          },
        ]
      : transaction.settlement.lines || [];

  const map = {};
  lines.forEach((line) => {
    const { currency, medium } = classifySettlementMedium(line.method, defaultCurrency);
    map[currency] = medium;
  });
  return map;
};
const buildOperationSummary = (transaction, balances, clientSnapshot, clientAddresses = []) => {
  if (!transaction) {
    return null;
  }
  return {
    id: transaction._id.toString(),
    code: transaction.operationCode || null,
    type: transaction.type,
    clientId: transaction.client ? transaction.client.toString() : null,
    clientName: clientSnapshot?.fullName || null,
    clientPhone: clientSnapshot?.phone || null,
    assets: {
      incoming: transaction.incomingAsset
        ? {
            code: transaction.incomingAsset.code,
            label: transaction.incomingAsset.label,
            amount: transaction.incomingAmount,
          }
        : null,
      outgoing: transaction.outgoingAsset
        ? {
            code: transaction.outgoingAsset.code,
            label: transaction.outgoingAsset.label,
            amount: transaction.outgoingAmount,
          }
        : null,
    },
    balances,
    clientAddresses,
  };
};

const loadTransaction = async (operationId) => {
  if (!mongoose.Types.ObjectId.isValid(operationId)) {
    throw new AppError('La operaciÃ³n indicada es invÃ¡lida.', 404);
  }
  const transaction = await Transaction.findById(operationId).lean();
  if (!transaction) {
    throw new AppError('No encontramos la operaciÃ³n vinculada.', 404);
  }
  return transaction;
};

const listByOperation = async (operationId) => {
  const transaction = await loadTransaction(operationId);
  const orders = await LogisticsOrder.find({ operationId })
    .sort({ createdAt: -1 })
    .lean();

  const snapshot = buildOperationSnapshot(transaction);
  const totalsMap = buildTotalsMap(snapshot);
  const allocated = computeAllocatedAmounts(orders);
  const balances = computeBalances(totalsMap, allocated);
  const { snapshot: clientSnapshot, addresses: clientAddresses } = await loadClientForLogistics(
    transaction.client
  );

  return {
    operation: buildOperationSummary(transaction, balances, clientSnapshot, clientAddresses),
    orders: orders.map(formatOrder),
    balances,
  };
};

const preparePayload = (payload, user) => {
  const type = payload.type === 'ENTREGA' ? 'ENTREGA' : 'RETIRO';
  const origin = normalizeString(payload.origin);
  const originAddressId = normalizeString(payload.originAddressId) || null;
  const destination = normalizeString(payload.destination);
  const destinationAddressId = normalizeString(payload.destinationAddressId) || null;
  const contactName = normalizeString(payload.contactName);
  const contactPhone = normalizeString(payload.contactPhone);
  const messengerId = toObjectId(payload.messengerId);
  const messenger = normalizeString(payload.messenger) || null;

  if (!origin || !destination) {
    throw new AppError('El origen y destino son obligatorios.', 422);
  }
  if (origin.toLowerCase() === destination.toLowerCase()) {
    throw new AppError('El origen y destino no pueden ser iguales.', 422);
  }
  if (originAddressId && destinationAddressId && originAddressId === destinationAddressId) {
    throw new AppError('Elegir direcciones distintas para origen y destino.', 422);
  }
  if (!contactName || !contactPhone) {
    throw new AppError('Indica el contacto responsable (nombre y telefono).', 422);
  }

  const { start: windowStart, end: windowEnd } = validateWindow(payload.windowStart, payload.windowEnd);

  const items = normalizeItems(payload.items || []);
  const status = payload.status === 'PROGRAMADA' ? 'PROGRAMADA' : 'BORRADOR';
  if (status === 'PROGRAMADA' && !canProgramOrder(user)) {
    throw new AppError('No tenes permisos para programar ordenes logisticas.', 403);
  }

  return {
    type,
    origin,
    originAddressId,
    destination,
    destinationAddressId,
    contactName,
    contactPhone,
    windowStart,
    windowEnd,
    status,
    items,
    notes: normalizeString(payload.notes) || null,
    internalNotes: normalizeString(payload.internalNotes) || null,
    messengerId,
    messenger,
  };
};

const createFromOperation = async (operationId, payload, context = {}) => {
  const userId = context.userId;
  if (!userId) {
    throw new AppError('AutenticaciÃ³n requerida.', 401);
  }
  const transaction = await loadTransaction(operationId);
  const normalized = preparePayload(payload, context.user);
  const existingOrders = await LogisticsOrder.find({ operationId }).lean();
  const snapshot = buildOperationSnapshot(transaction);
  const totalsMap = buildTotalsMap(snapshot);
  const allocated = computeAllocatedAmounts(existingOrders);
  ensureCapacity(normalized.items, totalsMap, allocated);

  const { orderNumber, orderYear, orderSequence } = await generateOrderNumber();
  const liquidationPercentage = computeLiquidationPercentage(
    normalized.type,
    normalized.items,
    transaction
  );
  const { snapshot: clientSnapshot } = await loadClientForLogistics(transaction.client);
  let messengerUser = null;
  if (normalized.messengerId) {
    messengerUser = await User.findById(normalized.messengerId).select('fullName email isMessenger').lean();
    if (!messengerUser) {
      throw new AppError('No encontramos al mensajero seleccionado.', 404);
    }
    if (!messengerUser.isMessenger) {
      throw new AppError('El usuario seleccionado no esta habilitado como mensajero.', 422);
    }
  }
  const messengerName = normalized.messenger || messengerUser?.fullName || messengerUser?.email || null;

  const order = await LogisticsOrder.create({
    operationId,
    operationModel: 'Transaction',
    operationType: transaction.type,
    operationCode: transaction.operationCode || transaction._id.toString(),
    orderNumber,
    orderSequence,
    orderYear,
    ...normalized,
    messengerId: messengerUser?._id || normalized.messengerId || null,
    messenger: messengerName,
    liquidationPercentage,
    operationSnapshot: snapshot,
    clientSnapshot,
    createdBy: userId,
    updatedBy: userId,
    createdByName: context.userName || context.user?.fullName || null,
    updatedByName: context.userName || context.user?.fullName || null,
    assignedTo: messengerUser?._id || context.userId || null,
  });

  return formatOrder(order);
};

const updateOrder = async (orderId, payload, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('El identificador de la orden es invalido.', 404);
  }
  const userId = context.userId;
  if (!userId) {
    throw new AppError('Autenticacion requerida.', 401);
  }

  const order = await LogisticsOrder.findById(orderId);
  if (!order) {
    throw new AppError('Orden logistica no encontrada.', 404);
  }
  if (order.status !== 'BORRADOR') {
    throw new AppError('Solo podes editar ordenes en borrador.', 409);
  }

  const transaction = await loadTransaction(order.operationId);
  const normalized = preparePayload(payload, context.user);
  let messengerUser = null;
  if (normalized.messengerId) {
    messengerUser = await User.findById(normalized.messengerId).select('fullName email isMessenger').lean();
    if (!messengerUser) {
      throw new AppError('No encontramos al mensajero seleccionado.', 404);
    }
    if (!messengerUser.isMessenger) {
      throw new AppError('El usuario seleccionado no esta habilitado como mensajero.', 422);
    }
  }
  const messengerName = normalized.messenger || messengerUser?.fullName || messengerUser?.email || null;

  const existingOrders = await LogisticsOrder.find({ operationId: order.operationId }).lean();
  const snapshot = buildOperationSnapshot(transaction);
  const totalsMap = buildTotalsMap(snapshot);
  const allocated = computeAllocatedAmounts(existingOrders, { excludeId: order._id });
  ensureCapacity(normalized.items, totalsMap, allocated);

  order.type = normalized.type;
  order.origin = normalized.origin;
  order.originAddressId = normalized.originAddressId;
  order.destination = normalized.destination;
  order.destinationAddressId = normalized.destinationAddressId;
  order.contactName = normalized.contactName;
  order.contactPhone = normalized.contactPhone;
  order.windowStart = normalized.windowStart;
  order.windowEnd = normalized.windowEnd;
  order.status = normalized.status;
  order.items = normalized.items;
  order.notes = normalized.notes;
  order.internalNotes = normalized.internalNotes;
  order.messengerId = messengerUser?._id || normalized.messengerId || null;
  order.messenger = messengerName;
  order.assignedTo = messengerUser?._id || userId || null;
  order.liquidationPercentage = computeLiquidationPercentage(normalized.type, normalized.items, transaction);
  order.operationSnapshot = snapshot;
  order.updatedBy = userId;
  order.updatedByName = context.userName || context.user?.fullName || null;

  await order.save();
  return formatOrder(order);
};

const getOrderById = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Orden logÃ­stica no encontrada.', 404);
  }
  const order = await LogisticsOrder.findById(orderId).lean();
  if (!order) {
    throw new AppError('Orden logÃ­stica no encontrada.', 404);
  }
  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order, { timeline });
};

const buildAssignedOrdersQuery = (userId, filters = {}) => {
  const query = {
    assignedTo: toObjectId(userId),
    status: { $in: LOGISTICS_ACTIVE_STATUSES },
  };

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : String(filters.status).split(',');
    const normalized = statuses
      .map((status) => String(status || '').trim().toUpperCase())
      .filter(Boolean);
    if (normalized.length) {
      query.status = { $in: normalized };
    }
  }

  if (filters.type) {
    query.type = String(filters.type).toUpperCase() === 'ENTREGA' ? 'ENTREGA' : 'RETIRO';
  }

  if (filters.dateFrom || filters.dateTo) {
    query.windowStart = {};
    if (filters.dateFrom) {
      query.windowStart.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      query.windowStart.$lte = new Date(filters.dateTo);
    }
  }

  if (filters.windowEndFrom || filters.windowEndTo) {
    query.windowEnd = {};
    if (filters.windowEndFrom) {
      query.windowEnd.$gte = new Date(filters.windowEndFrom);
    }
    if (filters.windowEndTo) {
      query.windowEnd.$lte = new Date(filters.windowEndTo);
    }
  }

  if (filters.search) {
    const term = String(filters.search).trim();
    if (term) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { orderNumber: regex },
        { contactName: regex },
        { contactPhone: regex },
        { origin: regex },
        { destination: regex },
      ];
    }
  }

  return query;
};

const filterByZone = (orders, zone) => {
  if (!zone) {
    return orders;
  }
  const term = String(zone).trim().toLowerCase();
  if (!term) {
    return orders;
  }
  return orders.filter((order) => {
    const origin = (order.origin || '').toLowerCase();
    const destination = (order.destination || '').toLowerCase();
    return origin.includes(term) || destination.includes(term);
  });
};

const sortAssignedOrders = (orders) =>
  orders.sort((a, b) => {
    const priorityDiff =
      (PRIORITY_SORT_ORDER[a.priority] ?? PRIORITY_SORT_ORDER.normal) -
      (PRIORITY_SORT_ORDER[b.priority] ?? PRIORITY_SORT_ORDER.normal);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    const timeA = new Date(a.windowStart).getTime();
    const timeB = new Date(b.windowStart).getTime();
    if (Number.isFinite(timeA) && Number.isFinite(timeB) && timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.orderNumber || '').localeCompare(b.orderNumber || '');
  });

const listAssignedOrders = async (userId, filters = {}) => {
  if (!userId) {
    throw new AppError('AutenticaciÃ³n requerida.', 401);
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Usuario invÃ¡lido.', 403);
  }
  const query = buildAssignedOrdersQuery(userId, filters);
  const orders = await LogisticsOrder.find(query).lean();
  const filtered = filterByZone(orders, filters.zone);
  const formatted = filtered.map((order) => formatOrder(order));
  sortAssignedOrders(formatted);
  return { orders: formatted };
};

const startRoute = async (orderId, context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (!ROUTE_START_STATUSES.includes(order.status)) {
    throw new AppError('Solo podÃ©s iniciar Ã³rdenes programadas o asignadas.', 409);
  }

  order.status = 'EN_CAMINO';
  order.startedAt = new Date();
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;

  await order.save();
  await recordTimelineEvent(
    order,
    {
      type: 'STARTED',
      title: 'Recorrido iniciado',
      description: `${order.updatedByName || 'LogÃ­stico'} marcÃ³ la orden en camino.`,
      metadata: {
        status: order.status,
        startedAt: order.startedAt,
      },
    },
    context
  );
  notifyOrderEvent(order, {
    title: 'Orden en camino',
    message: `La orden ${order.orderNumber || order._id.toString()} esta en camino.`,
    severity: 'info',
  });
  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const arriveOnSite = async (orderId, payload = {}, context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (!ROUTE_ARRIVAL_STATUSES.includes(order.status)) {
    throw new AppError('Solo podÃ©s marcar la llegada cuando la orden estÃ¡ en camino.', 409);
  }

  const gpsLat = Number(payload.gpsLat);
  const gpsLng = Number(payload.gpsLng);
  const distanceCheck = validateGeofenceDistance(order, gpsLat, gpsLng);
  if (!distanceCheck.ok) {
    throw new AppError('No estÃ¡s dentro de la geocerca permitida.', 422, {
      distance: distanceCheck.distance,
      gpsLat,
      gpsLng,
    });
  }

  order.status = 'EN_SITIO';
  order.arrivedAt = new Date();
  order.geofenceOK = true;
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;

  await order.save();
  await recordTimelineEvent(
    order,
    {
      type: 'ARRIVED',
      title: 'LogÃ­stico en sitio',
      description: 'Se confirmÃ³ la llegada al destino.',
      metadata: {
        gpsLat,
        gpsLng,
        distance: distanceCheck.distance,
        arrivedAt: order.arrivedAt,
      },
    },
    context
  );
  notifyOrderEvent(order, {
    title: 'Orden en sitio',
    message: `La orden ${order.orderNumber || order._id.toString()} llego al destino.`,
    severity: 'info',
  });
  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const validateItemUpdate = (item, payload) => {
  const received = payload.receivedAmount !== undefined ? Number(payload.receivedAmount) : null;
  const pending = payload.pendingAmount !== undefined ? Number(payload.pendingAmount) : null;
  const discrepancyFlag = Boolean(payload.discrepancyFlag);
  if (received !== null && !Number.isFinite(received)) {
    throw new AppError('El monto recibido es invÃ¡lido.', 422);
  }
  if (pending !== null && !Number.isFinite(pending)) {
    throw new AppError('El monto pendiente es invÃ¡lido.', 422);
  }
  if (!discrepancyFlag && received !== null && received > Number(item.expectedAmount) + ITEM_AMOUNT_TOLERANCE) {
    throw new AppError('El monto recibido supera lo esperado. MarcÃ¡ discrepancia para continuar.', 422);
  }
  return { received, pending, discrepancyFlag };
};

const updateItemsOnHandover = async (orderId, itemsPayload = [], context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (!HANDOVER_ALLOWED_STATUSES.includes(order.status)) {
    throw new AppError('Solo podÃ©s registrar conteo cuando estÃ¡s en sitio.', 409);
  }
  if (!Array.isArray(itemsPayload) || !itemsPayload.length) {
    throw new AppError('DebÃ©s enviar al menos un Ã­tem para actualizar.', 422);
  }

  itemsPayload.forEach((payload) => {
    if (!payload || !payload.id) {
      return;
    }
    const item = order.items.id(payload.id) || order.items.find((entry) => entry._id?.toString() === payload.id);
    if (!item) {
      throw new AppError('Ãtem de valor no encontrado.', 404);
    }
    const { received, pending, discrepancyFlag } = validateItemUpdate(item, payload);
    if (received !== null) {
      item.receivedAmount = received;
    }
    if (pending !== null) {
      item.pendingAmount = pending;
    }
    if (payload.discrepancyReason !== undefined) {
      item.discrepancyReason = payload.discrepancyReason || null;
    }
    if (payload.metadata) {
      item.metadata = {
        ...item.metadata,
        ...payload.metadata,
      };
    }
    item.discrepancyFlag = discrepancyFlag;
  });

  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;
  await order.save();

  await recordTimelineEvent(
    order,
    {
      type: 'ITEMS_UPDATED',
      title: 'Conteo actualizado',
      description: 'Se registraron montos y pendientes de los Ã­tems.',
    },
    context
  );

  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const addEvidence = async (orderId, payload = {}, files = [], context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (!LOGISTICS_ACTIVE_STATUSES.includes(order.status) && !HANDOVER_ALLOWED_STATUSES.includes(order.status)) {
    throw new AppError('No podÃ©s adjuntar evidencias en este estado.', 409);
  }
  const type = String(payload.type || '').trim();
  if (!type) {
    throw new AppError('IndicÃ¡ el tipo de evidencia.', 422);
  }
  if (!Array.isArray(files) || !files.length) {
    throw new AppError('DebÃ©s adjuntar al menos un archivo de evidencia.', 422);
  }

  const storedFiles = await storeEvidenceFiles(order._id.toString(), files);
  storedFiles.forEach((stored) => {
    order.evidences.push({
      type,
      url: stored.url,
      metadata: {
        ...(stored.metadata || {}),
        note: payload.note || null,
        gpsLat: payload.gpsLat !== undefined ? Number(payload.gpsLat) : stored.metadata?.gpsLat,
        gpsLng: payload.gpsLng !== undefined ? Number(payload.gpsLng) : stored.metadata?.gpsLng,
      },
    });
  });

  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;
  await order.save();

  await recordTimelineEvent(
    order,
    {
      type: 'EVIDENCE_ADDED',
      title: 'Evidencia cargada',
      description: `${storedFiles.length} archivo(s) subidos.`,
      metadata: {
        type,
        files: storedFiles.map((file) => file.url),
      },
    },
    context
  );

  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const completeTotal = async (orderId, context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (COMPLETION_BLOCKED_STATUSES.includes(order.status)) {
    throw new AppError('No podÃ©s completar una orden con discrepancias.', 409);
  }
  if (!HANDOVER_ALLOWED_STATUSES.includes(order.status)) {
    throw new AppError('DebÃ©s estar en sitio para completar la orden.', 409);
  }
  ensureRequiredEvidences(order);
  ensureItemsWithinTolerance(order);

  order.status = 'COMPLETADA_TOTAL';
  order.completedAt = new Date();
  const receipt = generateLogisticsReceipt(order);
  order.receiptId = receipt.receiptId;
  order.receiptUrl = receipt.receiptUrl;
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;

  await ensureTreasuryReceptionPending(order, context);
  const totals = computeReceptionTotals(order);
  if (totals?.totalsByCurrency?.length) {
    const mediumByCurrency = await inferSettlementMediums(order);
    await applyReceptionBalances(order, totals, { userId: context.userId }, { reverse: false, mediumByCurrency });
    order.treasuryReceptionStatus = 'confirmed';
    order.treasuryReception = order.treasuryReception || {};
    order.treasuryReception.closedWithoutAccountingImpact = false;
  }

  await order.save();
  await recordTimelineEvent(
    order,
    {
      type: 'COMPLETED_TOTAL',
      title: 'Orden completada',
      description: 'Se entregÃ³/retirÃ³ la totalidad de los valores.',
      metadata: {
        receiptId: receipt.receiptId,
        receiptUrl: receipt.receiptUrl,
      },
    },
    context
  );

  notifyOrderEvent(order, {
    title: 'Orden completada',
    message: `La orden ${order.orderNumber || order._id.toString()} fue completada.`,
    severity: 'success',
  });

  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const completePartial = async (orderId, pendingInfo = {}, context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (COMPLETION_BLOCKED_STATUSES.includes(order.status)) {
    throw new AppError('No podÃ©s completar una orden con discrepancias abiertas.', 409);
  }
  if (!HANDOVER_ALLOWED_STATUSES.includes(order.status)) {
    throw new AppError('DebÃ©s estar en sitio para completar la orden.', 409);
  }
  ensureRequiredEvidences(order);

  const pendingItems = Array.isArray(pendingInfo.items) ? pendingInfo.items : [];
  if (!pendingItems.length) {
    throw new AppError('IndicÃ¡ cuÃ¡les Ã­tems quedaron pendientes.', 422);
  }
  const pendingMap = new Map();
  pendingItems.forEach((entry) => {
    if (!entry?.id) {
      return;
    }
    pendingMap.set(entry.id, {
      pendingAmount: Number(entry.pendingAmount),
      receivedAmount: entry.receivedAmount !== undefined ? Number(entry.receivedAmount) : null,
      note: entry.note || null,
    });
  });
  if (!pendingMap.size) {
    throw new AppError('No se recibieron Ã­tems pendientes vÃ¡lidos.', 422);
  }

  let hasPending = false;
  order.items.forEach((item) => {
    if (!item?._id) {
      return;
    }
    const entry = pendingMap.get(item._id.toString());
    if (!entry) {
      return;
    }
    const expected = Number(item.expectedAmount) || 0;
    const received = Number(entry.receivedAmount ?? item.receivedAmount);
    const pending = Number(entry.pendingAmount);
    if (!Number.isFinite(pending) || pending < 0) {
      throw new AppError('El monto pendiente es invÃ¡lido.', 422);
    }
    if (!Number.isFinite(received) || received < 0) {
      throw new AppError('El monto recibido es invÃ¡lido.', 422);
    }
    if (pending + received > expected + ITEM_AMOUNT_TOLERANCE) {
      throw new AppError('La suma recibida + pendiente excede lo esperado.', 422);
    }
    item.receivedAmount = received;
    item.pendingAmount = pending;
    item.notes = entry.note || item.notes;
    hasPending = hasPending || pending > ITEM_AMOUNT_TOLERANCE;
  });

  if (!hasPending) {
    throw new AppError('Para completar parcial debe quedar al menos un pendiente.', 422);
  }

  order.status = 'COMPLETADA_PARCIAL';
  order.completedAt = new Date();
  const receipt = generateLogisticsReceipt(order);
  order.receiptId = receipt.receiptId;
  order.receiptUrl = receipt.receiptUrl;
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;

  await ensureTreasuryReceptionPending(order, context);
  const totals = computeReceptionTotals(order);
  if (totals?.totalsByCurrency?.length) {
    const mediumByCurrency = await inferSettlementMediums(order);
    await applyReceptionBalances(order, totals, { userId: context.userId }, { reverse: false, mediumByCurrency });
    order.treasuryReceptionStatus = 'confirmed';
    order.treasuryReception = order.treasuryReception || {};
    order.treasuryReception.closedWithoutAccountingImpact = false;
  }

  await order.save();
  await recordTimelineEvent(
    order,
    {
      type: 'COMPLETED_PARTIAL',
      title: 'Orden completada parcialmente',
      description: pendingInfo.reason || 'Quedaron valores pendientes.',
      metadata: {
        receiptId: receipt.receiptId,
        pendingItems: pendingItems.map((item) => item.id),
      },
    },
    context
  );

  notifyOrderEvent(order, {
    title: 'Orden completada parcialmente',
    message: `La orden ${order.orderNumber || order._id.toString()} quedo con pendientes.`,
    severity: 'warning',
  });

  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const reportDiscrepancy = async (orderId, payload = {}, context = {}) => {
  const userId = ensureAuthenticated(context);
  const { order } = await loadOrderForMessenger(orderId, userId, { includeTimeline: true });
  if (order.status === 'CANCELADA') {
    throw new AppError('No podÃ©s reportar discrepancias en Ã³rdenes canceladas.', 409);
  }
  const reason = String(payload.reason || '').trim();
  const description = String(payload.description || '').trim();
  if (!reason) {
    throw new AppError('IndicÃ¡ el motivo de la discrepancia.', 422);
  }

  order.status = 'DISCREPANCIA';
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || context.user?.fullName || null;
  order.internalNotes = [order.internalNotes, description].filter(Boolean).join('\n\n');

  await order.save();
  await recordTimelineEvent(
    order,
    {
      type: 'DISCREPANCIA_REPORTED',
      title: 'Discrepancia reportada',
      description: description || 'Se reportÃ³ un incidente en el handover.',
      metadata: {
        reason,
        evidenceIds: payload.evidenceIds || [],
      },
    },
    context
  );

  notifyOrderEvent(order, {
    title: 'Discrepancia en orden',
    message: `Se reporto una discrepancia en la orden ${order.orderNumber || order._id.toString()}.`,
    severity: 'warning',
    reason,
  });

  const timeline = await loadOrderTimeline(order._id);
  return formatOrder(order.toObject(), { timeline });
};

const getOrderTimeline = async (orderId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Orden logÃ­stica no encontrada.', 404);
  }
  if (!userId) {
    throw new AppError('AutenticaciÃ³n requerida.', 401);
  }
  const order = await LogisticsOrder.findById(orderId).select({ assignedTo: 1 }).lean();
  if (!order) {
    throw new AppError('Orden logÃ­stica no encontrada.', 404);
  }
  if (order.assignedTo && order.assignedTo.toString() !== userId.toString()) {
    throw new AppError('No tenÃ©s permisos para ver esta timeline.', 403);
  }
  const events = await loadOrderTimeline(orderId);
  return formatTimelineEvents(events);
};

const listMessengerOptions = async () => {
  const users = await User.find({ isMessenger: true })
    .select('fullName email _id')
    .sort({ fullName: 1, email: 1 })
    .lean();

  const mappedUsers = (users || [])
    .map((user) => {
      const label = user.fullName || user.email;
      if (!label) {
        return null;
      }
      return {
        id: user._id.toString(),
        name: label,
        email: user.email || null,
        type: 'user',
      };
    })
    .filter(Boolean);

  const seeded = SEEDED_MESSENGERS.map((entry) => ({
    ...entry,
    type: 'seed',
  }));

  return [...seeded, ...mappedUsers];
};

module.exports = {
  listByOperation,
  createFromOperation,
  updateOrder,
  getOrderById,
  listAssignedOrders,
  startRoute,
  arriveOnSite,
  updateItemsOnHandover,
  addEvidence,
  completeTotal,
  completePartial,
  reportDiscrepancy,
  getOrderTimeline,
  listMessengerOptions,
};

