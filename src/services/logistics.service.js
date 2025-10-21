const mongoose = require('mongoose');
const LogisticsOperation = require('../models/LogisticsOperation');

const buildQueryFromFilters = (filters = {}) => {
  const query = {};

  if (filters.search) {
    const pattern = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { operationCode: pattern },
      { contactName: pattern },
      { responsibleName: pattern },
      { origin: pattern },
      { destination: pattern },
      { routeDescription: pattern },
    ];
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.state) {
    query.state = filters.state;
  }

  if (filters.contact) {
    query.contactName = new RegExp(filters.contact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  if (filters.responsible) {
    query.responsibleName = filters.responsible;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.scheduledAt = {};
    if (filters.dateFrom) {
      query.scheduledAt.$gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      query.scheduledAt.$lte = toDate;
    }
  }

  return query;
};

const pickAmount = (amount) => {
  if (!amount || typeof amount.value !== 'number') return null;
  return {
    value: amount.value,
    currency: amount.currency || 'ARS',
  };
};

const buildRouteDescription = (operation) => {
  if (operation.routeDescription) {
    return operation.routeDescription;
  }
  if (operation.origin && operation.destination) {
    return `${operation.origin} → ${operation.destination}`;
  }
  return operation.origin || operation.destination || '';
};

const mapOperationToDto = (operation) => ({
  id: operation._id.toString(),
  operationCode: operation.operationCode,
  datetime: operation.scheduledAt,
  type: operation.type,
  state: operation.state,
  contact: operation.contactName,
  route: buildRouteDescription(operation),
  origin: operation.origin,
  destination: operation.destination,
  amount: pickAmount(operation.amount),
  responsible: operation.responsibleName,
  attachments: operation.attachments ?? [],
  timeline: operation.timeline ?? [],
  createdAt: operation.createdAt,
  updatedAt: operation.updatedAt,
});

const computeSummaryMetrics = async () => {
  const [active, pendingDeliveries, internalTransfers, completedToday] = await Promise.all([
    LogisticsOperation.countDocuments({ state: 'en-curso' }),
    LogisticsOperation.countDocuments({ state: 'pendiente', type: 'Entrega' }),
    LogisticsOperation.countDocuments({ type: 'Transferencia' }),
    (() => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return LogisticsOperation.countDocuments({ state: 'completado', scheduledAt: { $gte: since } });
    })(),
  ]);

  return {
    active,
    pendingDeliveries,
    internalTransfers,
    completedToday,
    trends: {
      active: 12,
      pendingDeliveries: -3,
      internalTransfers: 8,
      completedToday: 25,
    },
  };
};

const listOperations = async ({ filters = {}, page = 1, limit = 20 } = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const query = buildQueryFromFilters(filters);

  const [totalItems, operations, metrics] = await Promise.all([
    LogisticsOperation.countDocuments(query),
    LogisticsOperation.find(query)
      .sort({ scheduledAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit),
    computeSummaryMetrics(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / numericLimit));

  return {
    data: operations.map(mapOperationToDto),
    pagination: {
      page: numericPage,
      limit: numericLimit,
      totalItems,
      totalPages,
    },
    metrics,
  };
};

const getOperationById = async (idOrCode) => {
  if (!idOrCode) return null;

  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    const byId = await LogisticsOperation.findById(idOrCode);
    if (byId) return mapOperationToDto(byId);
  }

  const operation = await LogisticsOperation.findOne({ operationCode: idOrCode });
  return operation ? mapOperationToDto(operation) : null;
};

const createOperation = async (payload) => {
  const operation = await LogisticsOperation.create({
    ...payload,
    scheduledAt: payload.scheduledAt || new Date(),
  });
  return mapOperationToDto(operation);
};

const updateOperationState = async (id, { state }) => {
  if (!state || !['pendiente', 'en-curso', 'completado', 'anulado'].includes(state)) {
    const error = new Error('Estado de operación inválido');
    error.status = 400;
    throw error;
  }

  const operation = await LogisticsOperation.findById(id);
  if (!operation) {
    const error = new Error('Operación no encontrada');
    error.status = 404;
    throw error;
  }

  if (operation.state === 'completado' && state !== 'completado') {
    const error = new Error('Las operaciones completadas no pueden modificarse');
    error.status = 409;
    throw error;
  }

  operation.state = state;

  if (state === 'completado') {
    const now = new Date();
    operation.timeline = (operation.timeline || []).map((step, index) => ({
      ...step,
      status: 'completed',
      timestamp: step.timestamp || now,
      author: step.author || (index === 0 ? operation.responsibleName : step.author),
    }));
    if (!operation.timeline.length) {
      operation.timeline = [
        {
          label: 'Operación completada',
          status: 'completed',
          timestamp: now,
          author: operation.responsibleName || null,
        },
      ];
    }
  }

  if (state === 'anulado') {
    const now = new Date();
    operation.timeline = [
      ...(operation.timeline || []).filter((step) => step.status === 'completed'),
      {
        label: 'Operación anulada',
        status: 'completed',
        timestamp: now,
        author: operation.responsibleName || null,
      },
    ];
  }

  await operation.save();
  return mapOperationToDto(operation);
};

module.exports = {
  listOperations,
  getOperationById,
  createOperation,
  updateOperationState,
};
