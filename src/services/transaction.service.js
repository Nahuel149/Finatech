const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { getClientById } = require('./client.service');
const { applyTransactionRegistration } = require('./currentAccount.service');

const calculateMarginPercentage = (apr, marketApr) => {
  const parsedApr = Number(apr);
  const parsedMarketApr = Number(marketApr);
  if (!Number.isFinite(parsedApr) || !Number.isFinite(parsedMarketApr) || parsedMarketApr === 0) {
    return 0;
  }
  const diff = parsedApr - parsedMarketApr;
  return Number(((diff / parsedMarketApr) * 100).toFixed(4));
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

const formatTransaction = (transaction) => {
  if (!transaction) {
    return null;
  }
  const clientId =
    transaction.client && typeof transaction.client === 'object' && transaction.client._id
      ? transaction.client._id
      : transaction.client;

  return {
    id: transaction._id.toString(),
    clientId: clientId ? clientId.toString() : null,
    type: transaction.type,
    incomingAsset: transaction.incomingAsset,
    outgoingAsset: transaction.outgoingAsset,
    subtype: transaction.subtype,
    apr: transaction.apr,
    marketApr: transaction.marketApr,
    incomingAmount: transaction.incomingAmount,
    outgoingAmount: transaction.outgoingAmount,
    marginPercentage: transaction.marginPercentage,
    status: transaction.status,
    currentStep: transaction.currentStep,
    operationCode: transaction.operationCode || null,
    completedAt: transaction.completedAt || null,
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
    subtype,
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
  const subtypeValue = typeof subtype === 'string' ? subtype.trim() : '';

  if (!Number.isFinite(numericApr) || !Number.isFinite(numericMarketApr)) {
    throw new Error('APR values are required');
  }
  if (
    !Number.isFinite(numericIncoming) ||
    numericIncoming <= 0 ||
    !Number.isFinite(numericOutgoing) ||
    numericOutgoing <= 0
  ) {
    throw new Error('Amounts must be greater than 0');
  }

  if (!subtypeValue) {
    throw new Error('Subtype is required');
  }

  const marginPercentage = calculateMarginPercentage(numericApr, numericMarketApr);

  const normalizedType = type === 'sell' ? 'sell' : 'buy';

  const transaction = await Transaction.create({
    client: clientId,
    type: normalizedType,
    incomingAsset: incoming,
    outgoingAsset: outgoing,
    subtype: subtypeValue,
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
    createdBy: context.userId || null,
    lastUpdatedBy: context.userId || null,
  });

  return formatTransaction(transaction);
};

const getTransactionDraft = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const transaction = await Transaction.findById(id).lean();
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

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const {
    clientId,
    type,
    incomingAsset,
    outgoingAsset,
    subtype,
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
  const subtypeValue = typeof subtype === 'string' ? subtype.trim() : '';

  if (!Number.isFinite(numericApr) || !Number.isFinite(numericMarketApr)) {
    throw new Error('APR values are required');
  }
  if (!Number.isFinite(numericIncoming) || numericIncoming <= 0) {
    throw new Error('Incoming amount must be greater than 0');
  }
  if (!Number.isFinite(numericOutgoing) || numericOutgoing <= 0) {
    throw new Error('Outgoing amount must be greater than 0');
  }
  if (!subtypeValue) {
    throw new Error('Subtype is required');
  }

  const marginPercentage = calculateMarginPercentage(numericApr, numericMarketApr);

  const normalizedType = type === 'sell' ? 'sell' : 'buy';

  transaction.client = clientId;
  transaction.type = normalizedType;
  transaction.incomingAsset = incoming;
  transaction.outgoingAsset = outgoing;
  transaction.subtype = subtypeValue;
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
  transaction.lastUpdatedBy = context.userId || transaction.lastUpdatedBy || null;

  await transaction.save();

  return formatTransaction(transaction);
};

const updateTransactionSettlement = async (id, payload = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid transaction identifier');
  }

  const transaction = await Transaction.findById(id);
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
    const baseAmount =
      Number(transaction.incomingAmount) > 0
        ? Number(transaction.incomingAmount)
        : Number(transaction.outgoingAmount) > 0
        ? Number(transaction.outgoingAmount)
        : null;

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

  transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, 2);
  transaction.lastUpdatedBy = context.userId || transaction.lastUpdatedBy || null;
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

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  transaction.currentStep = Math.max(Number(transaction.currentStep) || 1, numericStep);
  transaction.lastUpdatedBy = context.userId || transaction.lastUpdatedBy || null;
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
    throw new Error('El monto del bien que ingresa debe ser mayor a cero.');
  }
  if (!Number.isFinite(Number(transaction.outgoingAmount)) || Number(transaction.outgoingAmount) <= 0) {
    throw new Error('El monto del bien que sale debe ser mayor a cero.');
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

  const session = await mongoose.startSession();
  let formatted;

  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findById(id).session(session);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === 'registered') {
        formatted = formatTransaction(transaction);
        return;
      }

      validateTransactionForFinalization(transaction);

      transaction.status = 'registered';
      transaction.currentStep = 3;
      transaction.operationCode = transaction.operationCode || (await generateOperationCode());
      transaction.completedAt = new Date();
      transaction.lastUpdatedBy = context.userId || transaction.lastUpdatedBy || null;

      await transaction.save({ session });

      await applyTransactionRegistration(transaction, {
        session,
        userId: context.userId,
      });

      formatted = formatTransaction(transaction);
    });
  } finally {
    session.endSession();
  }

  return formatted;
};

module.exports = {
  calculateMarginPercentage,
  createTransactionDraft,
  getTransactionDraft,
  buildWizardDraftResponse,
  updateTransactionDraft,
  updateTransactionSettlement,
  advanceTransactionStep,
  finalizeTransaction,
};
