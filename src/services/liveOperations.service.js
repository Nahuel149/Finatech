const Transaction = require('../models/Transaction');
const TransferOperation = require('../models/TransferOperation');
const TreasuryMovement = require('../models/TreasuryMovement');
const LogisticsOperation = require('../models/LogisticsOperation');
const { logger } = require('../utils/logger');
const { roundAmount } = require('./currentAccount.service');

// In-memory draft impacts (Step 2 drafts) with TTL
const draftImpactsStore = new Map(); // draftId -> { impacts, marginPercent, marginWeightArs, updatedAt, expiresAt }
const DRAFT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Buckets mapped to UI cards
const BUCKETS = {
  CASH: 'cash', // Efectivo (ARS)
  TRANSFERS: 'transfers', // Transferencias (ARS)
  USD: 'usd', // Caja USD
};

const ACTIVE_STATES = {
  transaction: ['pending', 'registered'],
  transfer: ['pending', 'registered'],
  treasury: ['registered'],
  logistics: ['pendiente', 'en-curso'],
};

const signFromDirection = (direction) => {
  const normalized = String(direction || '').toLowerCase();
  if (normalized === 'outgoing') return -1;
  if (normalized === 'incoming') return 1;
  return 0;
};

const stripDiacritics = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/[\u0300-\u036f]/g, '');

const mapSettlementMethodToBucket = (method) => {
  const normalized = stripDiacritics(method).toLowerCase();
  if (normalized.includes('efectivo') || normalized.includes('cash')) {
    return BUCKETS.CASH;
  }
  return BUCKETS.TRANSFERS;
};

const resolveSettlementSlices = (transaction, totalAmount) => {
  const safeTotal = roundAmount(totalAmount);
  if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
    return [];
  }

  const settlement = transaction?.settlement || null;
  const fallbackMethod = settlement?.simpleMethod || 'Transferencia';

  const buildSlice = (method, amount) => ({
    bucket: mapSettlementMethodToBucket(method),
    amount: roundAmount(amount),
  });

  if (!settlement || settlement.mode !== 'compound') {
    return [buildSlice(fallbackMethod, safeTotal)];
  }

  const lines = Array.isArray(settlement.lines) ? settlement.lines : [];
  if (!lines.length) {
    return [buildSlice(fallbackMethod, safeTotal)];
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

  const assignedTotal = roundAmount(amounts.reduce((sum, value) => sum + value, 0));
  const difference = roundAmount(safeTotal - assignedTotal);

  if (amounts.length && Math.abs(difference) > 0) {
    const lastIndex = amounts.length - 1;
    amounts[lastIndex] = roundAmount(amounts[lastIndex] + difference);
  }

  return lines
    .map((line, index) => buildSlice(line.method, amounts[index] || 0))
    .filter((slice) => Number.isFinite(slice.amount) && slice.amount > 0);
};

const mapTransactionToLive = (tx) => {
  if (!tx) return null;
  const marginPercent = Number(tx.marginPercentage) || 0;
  const outgoingAmount = Number(tx.outgoingAmount) || 0;
  const incomingAmount = Number(tx.incomingAmount) || 0;
  const incomingCurrency = String(tx.incomingAsset?.code || '').toUpperCase();
  const outgoingCurrency = String(tx.outgoingAsset?.code || '').toUpperCase();

  const impacts = {
    [BUCKETS.CASH]: 0,
    [BUCKETS.TRANSFERS]: 0,
    [BUCKETS.USD]: 0,
  };

  if (incomingCurrency === 'USD') {
    impacts[BUCKETS.USD] += incomingAmount;
  }
  if (outgoingCurrency === 'USD') {
    impacts[BUCKETS.USD] -= outgoingAmount;
  }

  let arsAmount = 0;
  let arsDirection = 0;
  if (incomingCurrency === 'ARS') {
    arsAmount = incomingAmount;
    arsDirection = 1;
  } else if (outgoingCurrency === 'ARS') {
    arsAmount = outgoingAmount;
    arsDirection = -1;
  }

  if (arsAmount) {
    const slices = resolveSettlementSlices(tx, arsAmount);
    if (!slices.length) {
      impacts[BUCKETS.TRANSFERS] += arsDirection * arsAmount;
    } else {
      slices.forEach((slice) => {
        impacts[slice.bucket] += arsDirection * slice.amount;
      });
    }
  }

  const marginWeightArs = Math.abs(arsAmount || 0);

  return {
    id: tx._id.toString(),
    source: 'transaction',
    state: tx.status || 'draft',
    impacts,
    marginPercent,
    marginWeightArs,
    updatedAt: tx.updatedAt || tx.createdAt || new Date(),
  };
};

const mapTransferOperationToLive = (op) => {
  if (!op) return null;
  const status = op.status || 'pending';
  const direction = signFromDirection(op.direction);
  const amount = Number(op.totalAmount) || 0;
  const currency = String(op.currency || 'ARS').toUpperCase();
  const movementType = String(op.movementType || '').toLowerCase();

  let bucket = BUCKETS.TRANSFERS;
  if (currency === 'USD') {
    bucket = BUCKETS.USD;
  } else if (movementType === 'cash') {
    bucket = BUCKETS.CASH;
  }

  const impacts = {
    [BUCKETS.CASH]: 0,
    [BUCKETS.TRANSFERS]: 0,
    [BUCKETS.USD]: 0,
  };
  impacts[bucket] += direction * amount;

  return {
    id: op._id.toString(),
    source: 'transfer',
    state: status,
    impacts,
    marginPercent: null,
    marginWeightArs: 0,
    updatedAt: op.updatedAt || op.createdAt || new Date(),
  };
};

const mapTreasuryMovementToLive = (mov) => {
  if (!mov) return null;
  const type = String(mov.type || '').toLowerCase();
  const sign = type === 'outgoing' ? -1 : 1;
  const amount = Number(mov.amount) || 0;
  const bucket = mov.balanceKey || BUCKETS.CASH;

  const impacts = {
    [BUCKETS.CASH]: 0,
    [BUCKETS.TRANSFERS]: 0,
    [BUCKETS.USD]: 0,
  };
  impacts[bucket] += sign * amount;

  return {
    id: mov._id.toString(),
    source: 'treasury',
    state: mov.status || 'registered',
    impacts,
    marginPercent: null,
    marginWeightArs: 0,
    updatedAt: mov.updatedAt || mov.movementAt || mov.createdAt || new Date(),
  };
};

const mapLogisticsOperationToLive = (op) => {
  if (!op || !op.amount || typeof op.amount.value !== 'number') return null;
  const amount = Number(op.amount.value) || 0;
  if (!amount) return null;
  const currency = String(op.amount.currency || 'ARS').toUpperCase();
  const state = op.state || 'pendiente';

  // Default bucket: transfers for ARS, usd for USD, cash if metadata has that hint
  let bucket = BUCKETS.TRANSFERS;
  if (currency === 'USD') {
    bucket = BUCKETS.USD;
  }
  if (op.metadata && typeof op.metadata.get === 'function') {
    const metaBucket = op.metadata.get('balanceKey');
    if (metaBucket && [BUCKETS.CASH, BUCKETS.TRANSFERS, BUCKETS.USD].includes(metaBucket)) {
      bucket = metaBucket;
    }
  }

  // Direction: use metadata.direction or metadata.sign; default incoming
  let direction = 1;
  if (op.metadata && typeof op.metadata.get === 'function') {
    const metaDir = op.metadata.get('direction') || op.metadata.get('sign');
    if (metaDir) {
      const normalized = String(metaDir).toLowerCase();
      if (normalized === 'outgoing' || normalized === '-' || normalized === 'debit') {
        direction = -1;
      }
    }
  }

  const impacts = {
    [BUCKETS.CASH]: 0,
    [BUCKETS.TRANSFERS]: 0,
    [BUCKETS.USD]: 0,
  };
  impacts[bucket] += direction * amount;

  return {
    id: op._id.toString(),
    source: 'logistics',
    state,
    impacts,
    marginPercent: null,
    marginWeightArs: currency === 'ARS' ? Math.abs(amount) : 0,
    updatedAt: op.updatedAt || op.createdAt || new Date(),
  };
};

const buildTotals = (items) => {
  const totals = {
    cash: 0,
    transfers: 0,
    usd: 0,
  };
  let weightedMarginSum = 0;
  let weightedMarginDen = 0;

  items.forEach((item) => {
    totals.cash += item.impacts[BUCKETS.CASH] || 0;
    totals.transfers += item.impacts[BUCKETS.TRANSFERS] || 0;
    totals.usd += item.impacts[BUCKETS.USD] || 0;

    if (item.source === 'transaction' && item.marginPercent != null && item.marginWeightArs) {
      weightedMarginSum += item.marginWeightArs * item.marginPercent;
      weightedMarginDen += item.marginWeightArs;
    }
  });

  const weightedMarginPercent =
    weightedMarginDen > 0 ? Number((weightedMarginSum / weightedMarginDen).toFixed(4)) : null;

  return { totals, weightedMarginPercent };
};

const purgeDrafts = () => {
  const now = Date.now();
  for (const [draftId, entry] of draftImpactsStore.entries()) {
    if (!entry || entry.expiresAt <= now) {
      draftImpactsStore.delete(draftId);
    }
  }
};

const upsertDraftImpact = ({ draftId, impacts, marginPercent = null, marginWeightArs = 0 }) => {
  if (!draftId || !impacts) return;
  purgeDrafts();
  logger.debug('live_ops_draft_upsert', {
    draftId: String(draftId),
    impacts: {
      cash: Number(impacts.cash) || 0,
      transfers: Number(impacts.transfers) || 0,
      usd: Number(impacts.usd) || 0,
    },
    marginPercent,
    marginWeightArs,
  });
  draftImpactsStore.set(String(draftId), {
    impacts: {
      cash: Number(impacts.cash) || 0,
      transfers: Number(impacts.transfers) || 0,
      usd: Number(impacts.usd) || 0,
    },
    marginPercent: marginPercent == null ? null : Number(marginPercent),
    marginWeightArs: Number(marginWeightArs) || 0,
    updatedAt: new Date(),
    expiresAt: Date.now() + DRAFT_TTL_MS,
  });
};

const removeDraftImpact = (draftId) => {
  if (!draftId) return;
  logger.debug('live_ops_draft_remove', { draftId: String(draftId) });
  draftImpactsStore.delete(String(draftId));
};

const mapDraftToLive = ([draftId, payload]) => {
  if (!payload) return null;
  return {
    id: `draft-${draftId}`,
    source: 'draft',
    state: 'draft',
    impacts: payload.impacts,
    marginPercent: payload.marginPercent,
    marginWeightArs: payload.marginWeightArs,
    updatedAt: payload.updatedAt || new Date(),
  };
};

const listActiveOperations = async () => {
  purgeDrafts();
  const draftIds = new Set(Array.from(draftImpactsStore.keys()));
  const [transactions, transfers, treasuryMovs, logisticsOps] = await Promise.all([
    Transaction.find({ status: { $in: ACTIVE_STATES.transaction } }),
    TransferOperation.find({ status: { $in: ACTIVE_STATES.transfer } }),
    TreasuryMovement.find({ status: { $in: ACTIVE_STATES.treasury } }),
    LogisticsOperation.find({ state: { $in: ACTIVE_STATES.logistics } }),
  ]);

  const items = [
    ...transactions
      .filter((tx) => !draftIds.has(tx._id.toString()))
      .map(mapTransactionToLive)
      .filter(Boolean),
    ...transfers.map(mapTransferOperationToLive).filter(Boolean),
    ...treasuryMovs.map(mapTreasuryMovementToLive).filter(Boolean),
    ...logisticsOps.map(mapLogisticsOperationToLive).filter(Boolean),
    ...Array.from(draftImpactsStore.entries()).map(mapDraftToLive).filter(Boolean),
  ];

  const { totals, weightedMarginPercent } = buildTotals(items);
  logger.debug('live_ops_snapshot', {
    counts: {
      drafts: draftIds.size,
      transactions: transactions.length,
      transfers: transfers.length,
      treasury: treasuryMovs.length,
      logistics: logisticsOps.length,
      items: items.length,
    },
    totals,
  });

  return {
    items,
    totals,
    weightedMarginPercent,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  listActiveOperations,
  BUCKETS,
  ACTIVE_STATES,
  upsertDraftImpact,
  removeDraftImpact,
};
