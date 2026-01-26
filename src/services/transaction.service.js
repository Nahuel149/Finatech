const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Client = require('../models/Client');
const TreasuryMovement = require('../models/TreasuryMovement');
const { getClientById } = require('./client.service');
const {
  applyTransactionRegistration,
  roundAmount,
  reverseTransactionRegistration,
} = require('./currentAccount.service');
const { registerTreasuryMovement } = require('./treasury.service');
const { emitBalanceUpdated } = require('../utils/eventBus');
const { emitNotification } = require('./notifications.service');

const calculateMarginPercentage = ({ type, incomingAmount, outgoingAmount, marketRate }) => {
  const numericIncoming = Number(incomingAmount);
  const numericOutgoing = Number(outgoingAmount);
  const numericMarket = Number(marketRate);

  if (
    !Number.isFinite(numericIncoming) ||
    !Number.isFinite(numericOutgoing) ||
    !Number.isFinite(numericMarket) ||
    numericIncoming <= 0 ||
    numericOutgoing <= 0 ||
    numericMarket === 0
  ) {
    return 0;
  }

  let operationRate;
  if (type === 'buy') {
    // Compra: ARS egresan, bien2 ingresa.
    operationRate = numericOutgoing / numericIncoming;
  } else {
    // Venta: ARS ingresan, bien2 egresa.
    operationRate = numericIncoming / numericOutgoing;
  }

  const diff = numericMarket - operationRate;
  return Number(((diff / numericMarket) * 100).toFixed(4));
};

const normalizeAsset = ({ code, label }) => {
  if (!code || !label) {
    throw new Error('Invalid asset definition');
  }
  return {
    code: String(code).trim(),
    label: String(label).trim(),
  };
};

const validateAssetDirection = (type, incomingAsset, outgoingAsset) => {
  const normalizedType = String(type || '').toLowerCase() === 'sell' ? 'sell' : 'buy';
  const incomingCode = String(incomingAsset?.code || '').trim().toUpperCase();
  const outgoingCode = String(outgoingAsset?.code || '').trim().toUpperCase();

  if (!incomingCode || !outgoingCode) {
    throw new Error('Asset codes are required');
  }

  if (normalizedType === 'buy') {
    if (incomingCode === 'ARS') {
      throw new Error('Una operacion de compra debe recibir un activo distinto de ARS.');
    }
    if (outgoingCode !== 'ARS') {
      throw new Error('Una operacion de compra debe pagar en ARS.');
    }
    return;
  }

  if (incomingCode !== 'ARS') {
    throw new Error('Una operacion de venta debe recibir ARS.');
  }

  if (outgoingCode === 'ARS') {
    throw new Error('Una operacion de venta debe entregar un activo distinto de ARS.');
  }
};

const stripDiacritics = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/[\u0300-\u036f]/g, '');

const mapSettlementMethodToMovementType = (method) => {
  const normalized = stripDiacritics(method).toLowerCase();
  if (normalized.includes('usd') || normalized.includes('dolar')) {
    return 'usd';
  }
  if (normalized.includes('efectivo') || normalized.includes('cash')) {
    return 'cash';
  }
  if (
    normalized.includes('deposito') ||
    normalized.includes('transfer') ||
    normalized.includes('banco') ||
    normalized.includes('cheque')
  ) {
    return 'transfer';
  }
  return 'transfer';
};

const SUPPORTED_TREASURY_CURRENCIES = new Set(['ARS', 'USD']);

const mapMovementTypeToMedium = (movementType) => {
  if (movementType === 'cash') {
    return 'cash';
  }
  if (movementType === 'transfer') {
    return 'transfer';
  }
  return 'cash';
};

const buildPlannedTreasuryMovements = (transaction) => {
  if (!transaction) {
    return [];
  }

  const incomingCurrency = transaction.incomingAsset?.code
    ? String(transaction.incomingAsset.code).toUpperCase()
    : null;
  const outgoingCurrency = transaction.outgoingAsset?.code
    ? String(transaction.outgoingAsset.code).toUpperCase()
    : null;
  const incomingAmount = roundAmount(transaction.incomingAmount);
  const outgoingAmount = roundAmount(transaction.outgoingAmount);
  const movementAt = transaction.completedAt ? new Date(transaction.completedAt) : new Date();
  const movements = [];

  const pushMovement = (movement) => {
    if (!movement || !movement.currency || !Number.isFinite(movement.amount) || movement.amount <= 0) {
      return;
    }
    movements.push({
      ...movement,
      movementAt,
      autoCompensate: false,
    });
  };

  const addArsMovements = (direction, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const slices = resolveSettlementSlices(transaction, amount);
    if (!slices.length) {
      const fallbackMethod = transaction?.settlement?.simpleMethod || 'Transferencia';
      const movementType = mapSettlementMethodToMovementType(fallbackMethod);
      pushMovement({
        type: direction,
        medium: mapMovementTypeToMedium(movementType),
        currency: 'ARS',
        amount,
      });
      return;
    }

    slices.forEach((slice) => {
      pushMovement({
        type: direction,
        medium: mapMovementTypeToMedium(slice.movementType),
        currency: 'ARS',
        amount: slice.amount,
      });
    });
  };

  const addForeignMovement = (direction, currency, amount) => {
    const normalizedCurrency = currency ? currency.toUpperCase() : null;
    if (!normalizedCurrency || !SUPPORTED_TREASURY_CURRENCIES.has(normalizedCurrency)) {
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    pushMovement({
      type: direction,
      medium: 'cash',
      currency: normalizedCurrency,
      amount,
    });
  };

  if (incomingCurrency) {
    if (incomingCurrency === 'ARS') {
      addArsMovements('incoming', incomingAmount);
    } else {
      addForeignMovement('incoming', incomingCurrency, incomingAmount);
    }
  }

  if (outgoingCurrency) {
    if (outgoingCurrency === 'ARS') {
      addArsMovements('outgoing', outgoingAmount);
    } else {
      addForeignMovement('outgoing', outgoingCurrency, outgoingAmount);
    }
  }

  return movements;
};



const resolveSettlementSlices = (transaction, totalAmount) => {
  const safeTotal = roundAmount(totalAmount);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
    return [];
  }

  const fallbackMethod = transaction?.settlement?.simpleMethod || 'Transferencia';

  if (!transaction?.settlement || transaction.settlement.mode === 'simple') {
    return [
      {
        method: fallbackMethod,
        movementType: mapSettlementMethodToMovementType(fallbackMethod),
        amount: safeTotal,
      },
    ];
  }

  const lines = Array.isArray(transaction.settlement.lines)
    ? transaction.settlement.lines
    : [];

  if (lines.length === 0) {
    return [
      {
        method: fallbackMethod,
        movementType: mapSettlementMethodToMovementType(fallbackMethod),
        amount: safeTotal,
      },
    ];
  }

  const amounts = lines.map((line) => {
    const baseValue = Number(line.value);
    if (!Number.isFinite(baseValue) || baseValue <= 0) {
      return 0;
    }

    const allocationType = line.allocationType === 'amount' ? 'amount' : 'percentage';
    if (allocationType === 'amount') {
      return roundAmount(baseValue);
    }

    const percentage = Number(line.computedPercentage ?? baseValue);
    if (!Number.isFinite(percentage) || percentage <= 0) {
      return 0;
    }
    return roundAmount((percentage / 100) * safeTotal);
  });

  const assignedTotal = amounts.reduce((sum, value) => sum + value, 0);
  let difference = roundAmount(safeTotal - assignedTotal);

  if (Math.abs(difference) > Math.max(0.5, safeTotal * 0.02)) {
    throw new Error('La liquidación no coincide con el monto total de la operación.');
  }

  if (amounts.length > 0 && Math.abs(difference) > 0) {
    const lastIndex = amounts.length - 1;
    amounts[lastIndex] = roundAmount(amounts[lastIndex] + difference);
    difference = roundAmount(
      safeTotal - amounts.reduce((sum, value) => sum + value, 0)
    );
  }

  if (Math.abs(difference) > 0.05) {
    throw new Error('No pudimos balancear la liquidación con el monto total.');
  }

  return lines
    .map((line, index) => ({
      method: line.method,
      movementType: mapSettlementMethodToMovementType(line.method),
      amount: amounts[index],
    }))
    .filter((slice) => Number.isFinite(slice.amount) && slice.amount > 0);
};

const formatTransaction = (transaction) => {
  if (!transaction) {
    return null;
  }
  const clientId =
    transaction.client && typeof transaction.client === 'object' && transaction.client._id
      ? transaction.client._id
      : transaction.client;
  const userId =
    transaction.user && typeof transaction.user === 'object' && transaction.user._id
      ? transaction.user._id
      : transaction.user;

  return {
    id: transaction._id.toString(),
    userId: userId ? userId.toString() : null,
    clientId: clientId ? clientId.toString() : null,
    type: transaction.type,
    incomingAsset: transaction.incomingAsset,
    outgoingAsset: transaction.outgoingAsset,
    apr: transaction.apr,
    marketApr: transaction.marketApr,
    incomingAmount: transaction.incomingAmount,
    outgoingAmount: transaction.outgoingAmount,
    marginPercentage: transaction.marginPercentage,
    status: transaction.status,
    currentStep: transaction.currentStep,
    operationCode: transaction.operationCode || null,
    completedAt: transaction.completedAt || null,
    voidedAt: transaction.voidedAt || null,
    voidedBy: transaction.voidedBy ? transaction.voidedBy.toString() : null,
    voidReason: transaction.voidReason || null,
    settlement: transaction.settlement
      ? {
          mode: transaction.settlement.mode,
          simpleMethod: transaction.settlement.simpleMethod,
          lines: Array.isArray(transaction.settlement.lines)
            ? transaction.settlement.lines.map((line) => ({
                method: line.method,
                allocationType: line.allocationType,
                value: line.value,
                computedPercentage: line.computedPercentage,
              }))
            : [],
          totalPercentage: transaction.settlement.totalPercentage ?? 0,
          isComplete: Boolean(transaction.settlement.isComplete),
        }
      : {
          mode: 'simple',
          simpleMethod: null,
          lines: [],
          totalPercentage: 0,
          isComplete: false,
        },
    accountingAudit: Array.isArray(transaction.accountingAudit)
      ? transaction.accountingAudit.map((entry) => ({
          action: entry.action,
          performedAt: entry.performedAt ? entry.performedAt.toISOString() : null,
          performedBy: entry.performedBy ? entry.performedBy.toString() : null,
          metadata: entry.metadata || {},
        }))
      : [],
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
};

const createTransactionDraft = async (payload, context = {}) => {
  const {
    clientId,
    type,
    incomingAsset,
    outgoingAsset,
    apr,
    marketApr,
    incomingAmount,
    outgoingAmount,
    notes,
  } = payload;

  const userId = context.userId;
  if (!userId) {
    throw new Error('User ID is required in context to create a draft');
  }

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new Error('Invalid client identifier');
  }

  const incoming = normalizeAsset(incomingAsset);
  const outgoing = normalizeAsset(outgoingAsset);

  const numericApr = Number(apr);
  const numericMarketApr = Number(marketApr);
  const numericIncoming = Number(incomingAmount);
  const numericOutgoing = Number(outgoingAmount);
  if (!Number.isFinite(numericApr) || !Number.isFinite(numericMarketApr)) {
    throw new Error('APR values are required');
  }
  validateAssetDirection(type, incoming, outgoing);
  if (
    !Number.isFinite(numericIncoming) ||
    numericIncoming <= 0 ||
    !Number.isFinite(numericOutgoing) ||
    numericOutgoing <= 0
  ) {
    throw new Error('Amounts must be greater than 0');
  }

  const normalizedType = type === 'sell' ? 'sell' : 'buy';
  const marginPercentage = calculateMarginPercentage({
    type: normalizedType,
    incomingAmount: numericIncoming,
    outgoingAmount: numericOutgoing,
    marketRate: numericMarketApr,
  });


  const transaction = await Transaction.create({
    user: userId,
    client: clientId,
    type: normalizedType,
    incomingAsset: incoming,
    outgoingAsset: outgoing,
    apr: numericApr,
    marketApr: numericMarketApr,
    incomingAmount: numericIncoming,
    outgoingAmount: numericOutgoing,
    marginPercentage,
    notes: notes || null,
    status: 'draft',
    currentStep: 1,
    settlement: {
      mode: 'simple',
      simpleMethod: null,
      lines: [],
      totalPercentage: 0,
      isComplete: false,
    },
    createdBy: userId,
    lastUpdatedBy: userId,
  });

  return formatTransaction(transaction);
};

const getTransactionDraft = async (id, userId, { bypassOwnership = false } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  if (!bypassOwnership && !userId) {
    throw new Error('User ID is required to fetch a draft');
  }

  const query = { _id: id };
  if (!bypassOwnership) {
    query.user = userId;
  }

  const transaction = await Transaction.findOne(query).lean();
  return formatTransaction(transaction);
};

const buildWizardDraftResponse = async (transaction) => {
  if (!transaction) {
    return null;
  }

  const client = await getClientById(transaction.clientId || transaction.client);
  return {
    ...transaction,
    client,
  };
};

const updateTransactionDraft = async (id, payload = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }

  const userId = context.userId;
  if (!userId) {
    throw new Error('User ID is required to update a draft');
  }

  const transaction = await Transaction.findOne({ _id: id, user: userId });
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const {
    clientId,
    type,
    incomingAsset,
    outgoingAsset,
    apr,
    marketApr,
    incomingAmount,
    outgoingAmount,
    notes,
  } = payload;

  if (!mongoose.Types.ObjectId.isValid(clientId)) {
    throw new Error('Invalid client identifier');
  }

  const incoming = normalizeAsset(incomingAsset);
  const outgoing = normalizeAsset(outgoingAsset);

  const numericApr = Number(apr);
  const numericMarketApr = Number(marketApr);
  const numericIncoming = Number(incomingAmount);
  const numericOutgoing = Number(outgoingAmount);

  if (!Number.isFinite(numericApr) || !Number.isFinite(numericMarketApr)) {
    throw new Error('APR values are required');
  }
  validateAssetDirection(type, incoming, outgoing);
  if (!Number.isFinite(numericIncoming) || numericIncoming <= 0) {
    throw new Error('Incoming amount must be greater than 0');
  }
  if (!Number.isFinite(numericOutgoing) || numericOutgoing <= 0) {
    throw new Error('Outgoing amount must be greater than 0');
  }

  const normalizedType = type === 'sell' ? 'sell' : 'buy';
  const marginPercentage = calculateMarginPercentage({
    type: normalizedType,
    incomingAmount: numericIncoming,
    outgoingAmount: numericOutgoing,
    marketRate: numericMarketApr,
  });

  transaction.client = clientId;
  transaction.type = normalizedType;
  transaction.incomingAsset = incoming;
  transaction.outgoingAsset = outgoing;
  transaction.apr = numericApr;
  transaction.marketApr = numericMarketApr;
  transaction.incomingAmount = numericIncoming;
  transaction.outgoingAmount = numericOutgoing;
  transaction.marginPercentage = marginPercentage;
  transaction.notes = notes || null;
  transaction.status = 'draft';
  transaction.currentStep = 1;
  transaction.settlement = {
    mode: 'simple',
    simpleMethod: null,
    lines: [],
    totalPercentage: 0,
    isComplete: false,
  };
  transaction.lastUpdatedBy = userId;

  await transaction.save();

  return formatTransaction(transaction);
};

const updateTransactionSettlement = async (id, payload = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }

  const userId = context.userId;
  if (!userId) {
    throw new Error('User ID is required to update settlement');
  }

  const transaction = await Transaction.findOne({ _id: id, user: userId });
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const mode = payload.mode === 'compound' ? 'compound' : 'simple';

  if (mode === 'simple') {
    const method = typeof payload.simpleMethod === 'string' ? payload.simpleMethod.trim() : '';
    if (!method) {
      throw new Error('Debe seleccionar un método de liquidación');
    }

    transaction.settlement = {
      mode: 'simple',
      simpleMethod: method,
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    };
  } else {
    // CAMBIO: Usar el monto correcto (ARS) según el tipo de operación
    const baseAmount =
      transaction.type === 'buy'
        ? Number(transaction.outgoingAmount)
        : Number(transaction.incomingAmount);

    if (!baseAmount || !Number.isFinite(baseAmount) || baseAmount <= 0) {
      throw new Error('La operación no tiene un monto base válido para calcular la liquidación');
    }

    const lines = Array.isArray(payload.lines) ? payload.lines : [];
    if (lines.length === 0) {
      throw new Error('Agregá al menos una línea de liquidación');
    }

    const normalizedLines = [];
    let totalPercentage = 0;

    lines.forEach((line, index) => {
      const method = typeof line.method === 'string' ? line.method.trim() : '';
      const allocationType =
        line.allocationType === 'amount' || line.allocationType === 'percentage'
          ? line.allocationType
          : 'percentage';
      const value = Number(line.value);

      if (!method) {
        throw new Error(`La línea ${index + 1} debe tener un método de liquidación`);
      }
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`La línea ${index + 1} debe tener un valor mayor a cero`);
      }

      let computedPercentage;
      if (allocationType === 'percentage') {
        computedPercentage = value;
      } else {
        computedPercentage = (value / baseAmount) * 100;
      }

      if (!Number.isFinite(computedPercentage) || computedPercentage <= 0) {
        throw new Error(`No se pudo calcular el porcentaje de la línea ${index + 1}`);
      }

      totalPercentage += computedPercentage;

      normalizedLines.push({
        method,
        allocationType,
        value: Number(value.toFixed(4)),
        computedPercentage: Number(computedPercentage.toFixed(4)),
      });
    });

    const roundedTotal = Number(totalPercentage.toFixed(4));
    const difference = Math.abs(roundedTotal - 100);
    const isComplete = difference <= 0.1;

    if (!isComplete) {
      throw new Error(
        `La suma de los métodos debe ser exactamente 100%. Diferencia actual: ${difference.toFixed(
          2
        )}%`
      );
    }

    transaction.settlement = {
      mode: 'compound',
      simpleMethod: null,
      lines: normalizedLines,
      totalPercentage: roundedTotal,
      isComplete: true,
    };
  }

  if (transaction.status === 'draft') {
    transaction.status = 'pending';
  }

  transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, 2);
  transaction.lastUpdatedBy = userId;
  await transaction.save();

  return formatTransaction(transaction);
};

const advanceTransactionStep = async (id, step = 1, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }
  const numericStep = Number(step);
  if (!Number.isInteger(numericStep) || numericStep < 1 || numericStep > 3) {
    throw new Error('Paso inválido.');
  }

  const userId = context.userId;
  if (!userId) {
    throw new Error('User ID is required to advance step');
  }

  const transaction = await Transaction.findOne({ _id: id, user: userId });
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (numericStep >= 2 && transaction.status === 'draft') {
    transaction.status = 'pending';
  }
  transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, numericStep);
  transaction.lastUpdatedBy = userId;
  await transaction.save();
  return formatTransaction(transaction);
};

const generateOperationCode = async () => {
  const prefix = 'FT-';
  let attempt = 0;
  while (attempt < 5) {
    const code = `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(
      Math.random() * 36
    ).toString(36).toUpperCase()}`;
    // Check uniqueness
    // eslint-disable-next-line no-await-in-loop
    const exists = await Transaction.exists({ operationCode: code });
    if (!exists) {
      return code;
    }
    attempt += 1;
  }
  // Fallback
  return `${prefix}${Date.now()}`;
};

const validateTransactionForFinalization = (transaction) => {
  if (!transaction.client) {
    throw new Error('La operación no tiene un cliente asignado.');
  }
  if (!Number.isFinite(Number(transaction.incomingAmount)) || Number(transaction.incomingAmount) <= 0) {
    throw new Error('El monto que recibe el cliente debe ser mayor a cero.');
  }
  if (!Number.isFinite(Number(transaction.outgoingAmount)) || Number(transaction.outgoingAmount) <= 0) {
    throw new Error('El monto que paga el cliente debe ser mayor a cero.');
  }
  if (!Number.isFinite(Number(transaction.apr)) || Number(transaction.apr) <= 0) {
    throw new Error('El tipo de cambio aplicado es inválido.');
  }
  if (!transaction.settlement || transaction.settlement.mode === 'simple') {
    if (!transaction.settlement?.simpleMethod) {
      throw new Error('Seleccioná un método de liquidación para continuar.');
    }
  } else if (transaction.settlement.mode === 'compound') {
    if (
      !Array.isArray(transaction.settlement.lines) ||
      transaction.settlement.lines.length === 0
    ) {
      throw new Error('Agregá al menos una línea de liquidación.');
    }
    const total = Number(transaction.settlement.totalPercentage || 0);
    if (Math.abs(total - 100) > 0.1) {
      throw new Error('La liquidación debe completar exactamente el 100%.');
    }
  }
};

const finalizeTransaction = async (id, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }

  const userId = context.userId;
  if (!userId) {
    throw new Error('User ID is required to finalize');
  }

  const session = await mongoose.startSession();
  let formatted;
  let registrationResult = null;
  let shouldEnsureTreasuryMovements = false;

  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({ _id: id, user: userId }).session(session);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'registered') {
        formatted = formatTransaction(transaction);
        shouldEnsureTreasuryMovements = true;
        return;
      }

      validateAssetDirection(transaction.type, transaction.incomingAsset, transaction.outgoingAsset);
      validateTransactionForFinalization(transaction);

      transaction.status = 'registered';
      transaction.currentStep = 3;
      transaction.operationCode = transaction.operationCode || (await generateOperationCode());
      transaction.completedAt = new Date();
      transaction.lastUpdatedBy = userId;

      registrationResult = await applyTransactionRegistration(transaction, {
        session,
        userId,
      });

      await transaction.save({ session });

      // Persist last margin on the client for future wizard defaults
      if (transaction.client && Number.isFinite(Number(transaction.marginPercentage))) {
        await Client.updateOne(
          { _id: transaction.client },
          { $set: { lastMarginPercentage: Number(transaction.marginPercentage) } },
          { session }
        );
      }

      formatted = formatTransaction(transaction);
      shouldEnsureTreasuryMovements = true;
    });
  } finally {
    session.endSession();
  }

  if (formatted && shouldEnsureTreasuryMovements) {
    const existingMovements = await TreasuryMovement.find({
      'linkedOperations.id': formatted.id,
      'linkedOperations.model': 'Transaction',
    })
      .select({ currency: 1, type: 1, medium: 1, amount: 1 })
      .lean();

    const existingKeys = new Set(
      existingMovements.map(
        (movement) =>
          `${movement.currency}:${movement.type}:${movement.medium}:${roundAmount(movement.amount)}`
      )
    );

    const plannedMovements = buildPlannedTreasuryMovements(formatted);

    for (const planned of plannedMovements) {
      const key = `${planned.currency}:${planned.type}:${planned.medium}:${roundAmount(planned.amount)}`;
      if (existingKeys.has(key)) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await registerTreasuryMovement(
        {
          type: planned.type,
          medium: planned.medium,
          currency: planned.currency,
          amount: planned.amount,
          movementAt: planned.movementAt,
          operation: { id: formatted.id, model: 'Transaction' },
        },
        {
          userId,
          autoCompensate: planned.autoCompensate,
          skipSettlement: true,
        }
      );

      existingKeys.add(key);
    }
  }

  if (registrationResult) {
    emitBalanceUpdated({
      source: 'transaction_registration',
      transactionId: formatted?.id || id,
      operationCode: formatted?.operationCode || null,
      currency: registrationResult.currency,
      delta: registrationResult.delta,
    });
  }

  if (formatted) {
    emitNotification({
      title: 'Operación confirmada',
      message: `La operación ${formatted.operationCode || formatted.id} fue confirmada correctamente.`,
      severity: 'success',
      actionLabel: 'Ver operación',
      actionUrl: `/dashboard/operaciones/detalle/${formatted.id}`,
      metadata: {
        operationId: formatted.id,
        operationCode: formatted.operationCode || null,
        type: formatted.type,
        incomingAmount: formatted.incomingAmount,
        outgoingAmount: formatted.outgoingAmount,
      },
      recipients: formatted.userId ? [{ user: formatted.userId }] : [],
      context: {
        type: 'operation',
        id: formatted.id,
        path: `/dashboard/operaciones/detalle/${formatted.id}`,
      },
    });
  }

  return formatted;
};

const voidTransaction = async (id, reason = '', context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }

  const userId = context.userId;
  const bypassOwnership = Boolean(context.bypassOwnership);
  if (!userId) {
    throw new Error('User ID is required to void');
  }

  const session = await mongoose.startSession();
  let formatted;
  let reversalResult = null;

  try {
    await session.withTransaction(async () => {
      const query = bypassOwnership ? { _id: id } : { _id: id, user: userId };
      const transaction = await Transaction.findOne(query).session(session);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'voided') {
        formatted = formatTransaction(transaction);
        return;
      }

      if (transaction.status === 'completed') {
        throw new Error('No podés anular una operación que ya fue liquidada.');
      }

      if (transaction.status !== 'registered' && transaction.status !== 'draft' && transaction.status !== 'pending') {
        throw new Error('El estado actual de la operación no permite anularla.');
      }

      if (transaction.status === 'registered') {
        reversalResult = await reverseTransactionRegistration(transaction, {
          session,
          userId,
        });
      }

      transaction.status = 'voided';
      transaction.voidedAt = new Date();
      transaction.voidedBy = userId;
      transaction.voidReason = reason ? String(reason).trim() || null : null;

      if (!Array.isArray(transaction.accountingAudit)) {
        transaction.accountingAudit = [];
      }
      transaction.accountingAudit.push({
        action: 'transaction_voided',
        performedBy: userId,
        performedAt: new Date(),
        metadata: {
          reason: transaction.voidReason,
        },
      });

      await transaction.save({ session });
      formatted = formatTransaction(transaction);
    });
  } finally {
    session.endSession();
  }

  if (reversalResult && formatted) {
    emitBalanceUpdated({
      source: 'transaction_void',
      transactionId: formatted.id,
      operationCode: formatted.operationCode,
      currency: reversalResult.currency,
      delta: reversalResult.delta,
    });
  }

  if (formatted) {
    const reasonSuffix = formatted.voidReason ? ` (${formatted.voidReason})` : '';
    emitNotification({
      title: 'Operación anulada',
      message: `La operación ${formatted.operationCode || formatted.id} fue anulada${reasonSuffix}.`,
      severity: 'warning',
      actionLabel: 'Ver operación',
      actionUrl: `/dashboard/operaciones/detalle/${formatted.id}`,
      metadata: {
        operationId: formatted.id,
        operationCode: formatted.operationCode || null,
        reason: formatted.voidReason || null,
      },
      recipients: formatted.userId ? [{ user: formatted.userId }] : [],
      context: {
        type: 'operation',
        id: formatted.id,
        path: `/dashboard/operaciones/detalle/${formatted.id}`,
      },
    });
  }

  return formatted;
};

const listTransactionDrafts = async ({ userId, bypassOwnership = false, limit = 20 } = {}) => {
  if (!bypassOwnership && !userId) {
    throw new Error('User ID is required to list drafts');
  }

  const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const query = {
    status: { $in: ['draft', 'pending'] },
  };

  if (!bypassOwnership) {
    query.user = userId;
  }

  const transactions = await Transaction.find(query)
    .sort({ updatedAt: -1 })
    .limit(sanitizedLimit)
    .lean();

  const formatted = transactions.map((transaction) => formatTransaction(transaction));
  const enriched = await Promise.all(
    formatted.map((transaction) => buildWizardDraftResponse(transaction))
  );

  return enriched.filter(Boolean);
};

module.exports = {
  calculateMarginPercentage,
  createTransactionDraft,
  getTransactionDraft,
  buildWizardDraftResponse,
  updateTransactionDraft,
  listTransactionDrafts,
  updateTransactionSettlement,
  advanceTransactionStep,
  finalizeTransaction,
  __testHelpers: {
    stripDiacritics,
    mapSettlementMethodToMovementType,
    resolveSettlementSlices,
    validateAssetDirection,
  },
  voidTransaction,
};

