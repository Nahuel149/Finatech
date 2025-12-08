const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { emitNotification } = require('./notifications.service');

const ensureAuditTrail = (transaction) => {
  if (!Array.isArray(transaction.accountingAudit)) {
    transaction.accountingAudit = [];
  }
};

const toNumberOrZero = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const resolveTransactionBaseAmount = (transaction, preferredCurrency) => {
  if (!transaction) {
    return 0;
  }

  const incomingCurrency = transaction.incomingAsset?.code
    ? String(transaction.incomingAsset.code).toUpperCase()
    : null;
  const outgoingCurrency = transaction.outgoingAsset?.code
    ? String(transaction.outgoingAsset.code).toUpperCase()
    : null;

  const incomingAmount = Math.abs(toNumberOrZero(transaction.incomingAmount));
  const outgoingAmount = Math.abs(toNumberOrZero(transaction.outgoingAmount));

  const preferred = preferredCurrency ? String(preferredCurrency).toUpperCase() : null;

  if (preferred) {
    if (incomingCurrency === preferred) {
      return incomingAmount;
    }
    if (outgoingCurrency === preferred) {
      return outgoingAmount;
    }
  }

  if (incomingCurrency === 'ARS') {
    return incomingAmount;
  }
  if (outgoingCurrency === 'ARS') {
    return outgoingAmount;
  }

  if (incomingAmount > 0) {
    return incomingAmount;
  }
  if (outgoingAmount > 0) {
    return outgoingAmount;
  }

  return 0;
};

const sumSettledAmount = (auditTrail, currency, excludeMovementId) => {
  if (!Array.isArray(auditTrail) || auditTrail.length === 0) {
    return 0;
  }

  const normalizedCurrency = currency ? String(currency).toUpperCase() : null;
  const excludedId = excludeMovementId ? String(excludeMovementId) : null;

  return auditTrail
    .filter((entry) => entry && entry.action === 'settlement_completed')
    .filter((entry) => {
      if (excludedId && entry?.metadata?.movementId === excludedId) {
        return false;
      }
      return true;
    })
    .filter((entry) => {
      if (!normalizedCurrency) {
        return true;
      }
      const entryCurrency = entry?.metadata?.currency
        ? String(entry.metadata.currency).toUpperCase()
        : null;
      return entryCurrency === normalizedCurrency;
    })
    .reduce((total, entry) => total + Math.abs(toNumberOrZero(entry?.metadata?.amount)), 0);
};

const normalizeMovementId = (movementId) => {
  if (!movementId) {
    return null;
  }
  try {
    return mongoose.Types.ObjectId.isValid(movementId)
      ? new mongoose.Types.ObjectId(movementId).toString()
      : String(movementId);
  } catch (error) {
    return String(movementId);
  }
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const recordTransactionSettlement = async (
  transactionId,
  impact = {},
  { session, userId } = {}
) => {
  if (!isValidObjectId(transactionId)) {
    return null;
  }

  const transaction = await Transaction.findById(transactionId).session(session || null);
  if (!transaction || transaction.status === 'voided') {
    return null;
  }

  const now = new Date();
  const normalizedMovementId = normalizeMovementId(impact.movementId);

  ensureAuditTrail(transaction);
  const auditMetadata = {
    movementId: normalizedMovementId,
    amount: null,
    currency: impact.currency ? String(impact.currency).toUpperCase() : null,
    direction: impact.direction || null,
    movementType: impact.movementType || null,
    source: impact.source || 'treasury',
  };

  const impactAmount = Math.abs(toNumberOrZero(impact.amount));
  if (impactAmount === 0) {
    return transaction;
  }

  auditMetadata.amount = impactAmount;

  const baseAmount = resolveTransactionBaseAmount(transaction, auditMetadata.currency);
  if (baseAmount > 0) {
    const alreadySettled = sumSettledAmount(
      transaction.accountingAudit,
      auditMetadata.currency,
      normalizedMovementId
    );

    if (alreadySettled + impactAmount > baseAmount + 0.01) {
      throw new Error('La operación ya fue compensada en su totalidad.');
    }
  }

  const existingIndex = transaction.accountingAudit.findIndex(
    (entry) =>
      entry.action === 'settlement_completed' &&
      normalizedMovementId &&
      entry.metadata &&
      entry.metadata.movementId === normalizedMovementId
  );

  if (existingIndex >= 0) {
    transaction.accountingAudit[existingIndex].performedAt = now;
    transaction.accountingAudit[existingIndex].performedBy =
      userId && isValidObjectId(userId) ? userId : null;
    transaction.accountingAudit[existingIndex].metadata = {
      ...(transaction.accountingAudit[existingIndex].metadata || {}),
      ...auditMetadata,
    };
  } else {
    transaction.accountingAudit.push({
      action: 'settlement_completed',
      performedAt: now,
      performedBy: userId && isValidObjectId(userId) ? userId : null,
      metadata: auditMetadata,
    });
  }

  transaction.status = 'completed';
  if (!transaction.completedAt) {
    transaction.completedAt = now;
  }
  if (userId && isValidObjectId(userId)) {
    transaction.lastUpdatedBy = userId;
  }

  await transaction.save({ session });

  const operationId = transaction._id.toString();
  const operationCode = transaction.operationCode || operationId;
  const amountLabel = auditMetadata.amount
    ? `${auditMetadata.amount} ${auditMetadata.currency || ''}`.trim()
    : 'la operación';

  emitNotification({
    title: 'Operación liquidada',
    message: `Se liquidó ${amountLabel} para ${operationCode}.`,
    severity: 'success',
    actionLabel: 'Ver operación',
    actionUrl: `/dashboard/operaciones/detalle/${operationId}`,
    metadata: {
      operationId,
      operationCode,
      amount: auditMetadata.amount || null,
      currency: auditMetadata.currency || null,
      movementId: normalizedMovementId,
    },
    recipients: transaction.user ? [{ user: transaction.user.toString() }] : [],
    context: {
      type: 'operation',
      id: operationId,
      path: `/dashboard/operaciones/detalle/${operationId}`,
    },
  });

  return transaction;
};

const revertTransactionSettlement = async (
  transactionId,
  movementId,
  { session, userId } = {}
) => {
  if (!isValidObjectId(transactionId)) {
    return null;
  }

  const transaction = await Transaction.findById(transactionId).session(session || null);
  if (!transaction) {
    return null;
  }

  ensureAuditTrail(transaction);

  const normalizedMovementId = normalizeMovementId(movementId);

  const previousLength = transaction.accountingAudit.length;
  if (normalizedMovementId) {
    transaction.accountingAudit = transaction.accountingAudit.filter(
      (entry) =>
        entry.action !== 'settlement_completed' ||
        !entry.metadata ||
        entry.metadata.movementId !== normalizedMovementId
    );
  }

  const settlementEntriesRemaining = transaction.accountingAudit.some(
    (entry) => entry.action === 'settlement_completed'
  );

  if (!settlementEntriesRemaining) {
    transaction.status = 'registered';
    transaction.completedAt = null;
  }

  if (previousLength !== transaction.accountingAudit.length && normalizedMovementId) {
    transaction.accountingAudit.push({
      action: 'settlement_reverted',
      performedAt: new Date(),
      performedBy: userId && isValidObjectId(userId) ? userId : null,
      metadata: {
        movementId: normalizedMovementId,
      },
    });
  }

  if (userId && isValidObjectId(userId)) {
    transaction.lastUpdatedBy = userId;
  }

  await transaction.save({ session });
  return transaction;
};

module.exports = {
  recordTransactionSettlement,
  revertTransactionSettlement,
};
