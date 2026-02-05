const { logger } = require('../utils/logger');

// In-memory draft impacts (Step 2 drafts) with TTL
const draftImpactsStore = new Map(); // draftId -> { impacts, marginPercent, marginWeightArs, updatedAt, expiresAt }
const DRAFT_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Buckets mapped to UI cards
const BUCKETS = {
  CASH: 'cash', // Efectivo (ARS)
  TRANSFERS: 'transfers', // Transferencias (ARS)
  USD: 'usd', // Caja USD
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

  const items = [
    ...Array.from(draftImpactsStore.entries()).map(mapDraftToLive).filter(Boolean),
  ];

  const { totals, weightedMarginPercent } = buildTotals(items);
  logger.debug('live_ops_snapshot', {
    counts: {
      drafts: items.length,
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
  upsertDraftImpact,
  removeDraftImpact,
};
