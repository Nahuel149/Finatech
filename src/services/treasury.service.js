const mongoose = require('mongoose');
const TreasuryBalance = require('../models/TreasuryBalance');
const TreasuryMovement = require('../models/TreasuryMovement');
const LogisticsOrder = require('../models/LogisticsOrder');
const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const TransferOperation = require('../models/TransferOperation');
const { getLatestMarketRate } = require('./marketRate.service');
const AppError = require('../utils/AppError');
const CurrentAccountMovement = require('../models/CurrentAccountMovement');
const {
  recordTransactionSettlement,
  revertTransactionSettlement,
} = require('./transactionLifecycle.service');
const { emitBalanceUpdated } = require('../utils/eventBus');
const { emitNotification } = require('./notifications.service');

const normalizeTransferToSuggestion = (operation) => {
  if (!operation) return null;
  const id = operation._id ? operation._id.toString() : operation.id;
  return {
    id,
    code: operation.operationCode ? `#${operation.operationCode}` : id,
    model: 'TransferOperation',
    amount: Number(operation.totalAmount || 0),
    currency: operation.currency || 'ARS',
    movementType: operation.movementType,
    direction: operation.direction,
    medium: operation.movementType === 'cash' ? 'cash' : 'transfer',
    status: operation.status,
    confirmedAt: operation.confirmedAt ? new Date(operation.confirmedAt).toISOString() : null,
    description:
      (Array.isArray(operation.contacts) && operation.contacts[0]?.shortName) ||
      (Array.isArray(operation.contacts) && operation.contacts[0]?.fullName) ||
      (Array.isArray(operation.distributionLines) && operation.distributionLines[0]?.contactName) ||
      null,
  };
};

const normalizeTreasuryMovementToSuggestion = (movement) => {
  if (!movement) return null;
  return {
    id: movement._id ? movement._id.toString() : movement.id,
    code: movement.movementCode || null,
    model: 'TreasuryMovement',
    amount: Number(movement.amount || 0),
    currency: movement.currency || 'ARS',
    movementType: movement.type,
    direction: movement.type,
    medium: movement.medium || null,
    status: movement.status,
    confirmedAt: movement.movementAt ? new Date(movement.movementAt).toISOString() : null,
    description: movement.reference || movement.description || null,
  };
};

const normalizeTransactionToSuggestion = (transaction) => {
  if (!transaction) return null;

  const preferredCurrencies = [
    'ARS',
    'USD',
    transaction.outgoingAsset?.code,
    transaction.incomingAsset?.code,
  ].filter(Boolean);

  let amount = null;
  let currency = null;

  for (const code of preferredCurrencies) {
    const value = deriveTransactionAmountForCurrency(transaction, code);
    if (Number.isFinite(value)) {
      amount = Number(value);
      currency = code.toUpperCase();
      break;
    }
  }

  if (!Number.isFinite(amount)) {
    amount = Number(transaction.outgoingAmount || transaction.incomingAmount || 0);
  }

  if (!currency) {
    currency =
      transaction.outgoingAsset?.code ||
      transaction.incomingAsset?.code ||
      'ARS';
  }

  const direction = transaction.type === 'buy' ? 'outgoing' : 'incoming';

  return {
    id: transaction._id ? transaction._id.toString() : transaction.id,
    code: transaction.operationCode || null,
    model: 'Transaction',
    amount: Number.isFinite(amount) ? amount : 0,
    currency: currency || 'ARS',
    movementType: direction,
    direction,
    medium: null,
    status: transaction.status || null,
    confirmedAt: transaction.completedAt
      ? new Date(transaction.completedAt).toISOString()
      : null,
    description: transaction.notes || null,
  };
};

const BALANCE_METADATA = {
  transfers: {
    label: 'Transferencias en ARS',
    status: 'ok',
  },
  cash: {
    label: 'Efectivo en ARS',
    status: 'ok',
  },
  usd: {
    label: 'Caja en USD',
    status: 'warning',
  },
  courier_in_transit: {
    label: 'Fondos en tránsito',
    status: 'warning',
  },
};

const SUMMARY_EXCLUDED_ACCOUNT_KEYS = new Set(['cash', 'transfers', 'usd']);

const LINKED_BALANCE_CONFIG = {
  usd: {
    id: 'usd',
    label: 'Caja USD',
    currency: 'USD',
    accountingLabel: 'Caja Moneda Extranjera USD',
  },
  cash: {
    id: 'cash',
    label: 'Efectivo (ARS)',
    currency: 'ARS',
    accountingLabel: 'Caja General ARS',
  },
  transfers: {
    id: 'transfers',
    label: 'Transferencias (ARS)',
    currency: 'ARS',
    accountingLabel: 'Transferencias Bancarias ARS',
  },
};

const DEFAULT_VARIATION_WINDOW_DAYS = 7;
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_GLOBAL_BALANCES_LIMIT = 15;
const GLOBAL_BALANCE_SORT_FIELDS = new Set(['balance', 'name', 'variation', 'lastMovement']);
const BALANCE_STATE_VALUES = ['positive', 'negative', 'zero'];
const CONTACT_BALANCE_DEFAULT_LIMIT = 20;
const CONTACT_BALANCE_SORT_FIELDS = new Set(['date', 'amount', 'type']);

const LOGISTICS_COMPLETED_STATUSES = [
  'COMPLETADA',
  'COMPLETADA_TOTAL',
  'COMPLETADA_PARCIAL',
  'DISCREPANCIA',
];
const RECEPTION_STATUS_VALUES = ['pending', 'confirmed', 'omitted'];
const DEFAULT_RECEPTIONS_LIMIT = 25;

const MOVEMENT_MEDIUMS = ['cash', 'transfer', 'deposit'];
const MOVEMENT_TYPES = ['incoming', 'outgoing'];
const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

const normalizeCurrencyCode = (value) => String(value || '').toUpperCase();

const resolveUsdSellRate = async () => {
  try {
    const rate = await getLatestMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' });
    const numeric = Number(rate?.sellRate || rate?.rate || null);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  } catch (error) {
    return null;
  }
};

const convertAmountToCurrency = (amount, fromCurrency, toCurrency, usdSellRate) => {
  if (!Number.isFinite(amount)) {
    return null;
  }
  const source = normalizeCurrencyCode(fromCurrency);
  const target = normalizeCurrencyCode(toCurrency);
  if (!source || !target) {
    return null;
  }
  if (source === target) {
    return amount;
  }
  if (!usdSellRate || !Number.isFinite(usdSellRate) || usdSellRate <= 0) {
    return null;
  }
  if (source === 'USD' && target === 'ARS') {
    return amount * usdSellRate;
  }
  if (source === 'ARS' && target === 'USD') {
    return amount / usdSellRate;
  }
  return null;
};

const buildCurrencyCandidates = (currency) => {
  const normalized = normalizeCurrencyCode(currency);
  if (normalized === 'ARS') {
    return ['ARS', 'USD'];
  }
  if (normalized === 'USD') {
    return ['USD', 'ARS'];
  }
  return normalized ? [normalized] : [];
};

const getBalanceConfig = (key) => {
  if (!key) {
    return null;
  }
  const normalized = String(key).toLowerCase();
  return LINKED_BALANCE_CONFIG[normalized] || null;
};

const parseDateFilter = (value, { endOfDay = false } = {}) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

const buildMovementMatch = (key, filters = {}) => {
  const match = {
    balanceKey: key,
  };

  const normalizedType =
    typeof filters.type === 'string' && MOVEMENT_TYPES.includes(filters.type.toLowerCase())
      ? filters.type.toLowerCase()
      : null;

  if (normalizedType) {
    match.type = normalizedType;
  }

  const dateFrom = parseDateFilter(filters.dateFrom);
  const dateTo = parseDateFilter(filters.dateTo, { endOfDay: true });

  if (dateFrom || dateTo) {
    match.movementAt = {};
    if (dateFrom) {
      match.movementAt.$gte = dateFrom;
    }
    if (dateTo) {
      match.movementAt.$lte = dateTo;
    }
  }

  if (filters.contactId && mongoose.Types.ObjectId.isValid(filters.contactId)) {
    match.contact = new mongoose.Types.ObjectId(filters.contactId);
  }

  return match;
};

const fetchMovementTotalsForBalance = async (key, filters = {}) => {
  const match = buildMovementMatch(key, filters);
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$type',
        amount: { $sum: '$amount' },
      },
    },
  ];

  const groupedTotals = await TreasuryMovement.aggregate(pipeline);

  const totals = groupedTotals.reduce(
    (acc, entry) => {
      if (entry._id === 'incoming') {
        acc.incoming = roundAmount(entry.amount);
      } else if (entry._id === 'outgoing') {
        acc.outgoing = roundAmount(entry.amount);
      }
      return acc;
    },
    { incoming: 0, outgoing: 0 }
  );

  totals.net = roundAmount(totals.incoming - totals.outgoing);
  return totals;
};

const computeVariationForBalance = async (key, { days = DEFAULT_VARIATION_WINDOW_DAYS } = {}) => {
  const windowDays = Math.max(Number(days) || DEFAULT_VARIATION_WINDOW_DAYS, 1);
  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - windowDays * MS_IN_DAY);
  const previousWindowStart = new Date(currentWindowStart.getTime() - windowDays * MS_IN_DAY);

  const [currentTotals, previousTotals] = await Promise.all([
    fetchMovementTotalsForBalance(key, {
      dateFrom: currentWindowStart.toISOString(),
      dateTo: now.toISOString(),
    }),
    fetchMovementTotalsForBalance(key, {
      dateFrom: previousWindowStart.toISOString(),
      dateTo: currentWindowStart.toISOString(),
    }),
  ]);

  const currentNet = currentTotals.net;
  const previousNet = previousTotals.net;

  let variationPercentage = null;
  if (Math.abs(previousNet) > 0) {
    variationPercentage = roundAmount(((currentNet - previousNet) / Math.abs(previousNet)) * 100);
  } else if (Math.abs(currentNet) > 0) {
    variationPercentage = 100;
  } else {
    variationPercentage = 0;
  }

  const direction =
    variationPercentage > 0 ? 'up' : variationPercentage < 0 ? 'down' : 'flat';

  return {
    windowDays,
    percentage: variationPercentage,
    direction,
    currentNet,
    previousNet,
  };
};

const fetchRecentMovementsForBalance = async (key, limit = 3, filters = {}) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 3, 1), 20);
  const match = buildMovementMatch(key, filters);

  const movements = await TreasuryMovement.find(match)
    .sort({ movementAt: -1 })
    .limit(sanitizedLimit)
    .lean();

  if (!movements.length) {
    return [];
  }

  const contactIds = movements
    .map((movement) => movement.contact)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => id.toString());

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1, email: 1 })
        .lean()
    : [];

  return movements.map((movement) => formatTreasuryMovement(movement, contacts));
};

const fetchContactSummariesForBalance = async (key, limit = 3, filters = {}) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 3, 1), 20);
  const match = buildMovementMatch(key, filters);
  match.contact = { $ne: null };

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$contact',
        incoming: {
          $sum: {
            $cond: [{ $eq: ['$type', 'incoming'] }, '$amount', 0],
          },
        },
        outgoing: {
          $sum: {
            $cond: [{ $eq: ['$type', 'outgoing'] }, '$amount', 0],
          },
        },
        lastMovementAt: { $max: '$movementAt' },
        count: { $sum: 1 },
      },
    },
    { $sort: { lastMovementAt: -1 } },
    { $limit: sanitizedLimit },
  ];

  const grouped = await TreasuryMovement.aggregate(pipeline);

  if (!grouped.length) {
    return [];
  }

  const contactIds = grouped
    .map((entry) => entry._id)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const contacts = await Client.find({ _id: { $in: contactIds } })
    .select({ fullName: 1, shortName: 1, contactType: 1, status: 1, email: 1 })
    .lean();

  const contactMap = new Map(
    contacts.map((contact) => [contact._id ? contact._id.toString() : contact.id, contact])
  );

  return grouped.map((entry) => {
    const contactDoc = contactMap.get(entry._id.toString());
    const formattedContact = contactDoc ? formatContact(contactDoc) : { id: entry._id.toString() };
    return {
      contact: {
        ...formattedContact,
        email: contactDoc?.email || null,
      },
      totals: {
        incoming: roundAmount(entry.incoming || 0),
        outgoing: roundAmount(entry.outgoing || 0),
        net: roundAmount((entry.incoming || 0) - (entry.outgoing || 0)),
      },
      lastMovementAt: entry.lastMovementAt ? new Date(entry.lastMovementAt).toISOString() : null,
      movementCount: entry.count || 0,
    };
  });
};

const fetchAccountingSummaryForBalance = async (key) => {
  const config = getBalanceConfig(key);
  if (!config) {
    return null;
  }

  const pipeline = [
    {
      $match: {
        ledger: 'general',
        'counterpart.key': key,
        currency: config.currency,
      },
    },
    {
      $group: {
        _id: null,
        balance: { $sum: '$amount' },
        lastOperationAt: { $max: '$createdAt' },
      },
    },
  ];

  const [summary] = await CurrentAccountMovement.aggregate(pipeline);

  const balance = summary ? roundAmount(summary.balance || 0) : 0;
  const lastOperationAt = summary?.lastOperationAt
    ? new Date(summary.lastOperationAt).toISOString()
    : null;

  let state = 'sin_movimientos';
  if (lastOperationAt) {
    const lastOperationDate = new Date(lastOperationAt);
    const diffDays = (Date.now() - lastOperationDate.getTime()) / MS_IN_DAY;
    state = diffDays <= DEFAULT_VARIATION_WINDOW_DAYS ? 'activo' : 'inactivo';
  }

  return {
    accountName: config.accountingLabel,
    currency: config.currency,
    balance,
    lastOperationAt,
    state,
  };
};

const fetchRecentActivityForBalance = async (key, limit = 5) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 5, 1), 25);

  const activityEntries = await CurrentAccountMovement.find({
    'counterpart.key': key,
  })
    .sort({ createdAt: -1 })
    .limit(sanitizedLimit)
    .lean();

  if (!activityEntries.length) {
    return [];
  }

  const contactIds = activityEntries
    .map((entry) => entry.contact)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => id.toString());

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1 })
        .lean()
    : [];

  const contactMap = new Map(
    contacts.map((contact) => [contact._id ? contact._id.toString() : contact.id, contact])
  );

  return activityEntries.map((entry) => {
    const contactDoc = entry.contact ? contactMap.get(entry.contact.toString()) : null;
    return {
      id: entry._id ? entry._id.toString() : null,
      createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
      ledger: entry.ledger,
      stage: entry.stage,
      amount: roundAmount(entry.amount || 0),
      currency: entry.currency,
      direction: entry.amount >= 0 ? 'positive' : 'negative',
      operation: entry.operation
        ? {
            id:
              entry.operation.id && typeof entry.operation.id === 'object'
                ? entry.operation.id.toString()
                : entry.operation.id || null,
            code: entry.operation.code || null,
            type: entry.operation.type || null,
            source: entry.operation.source || null,
          }
        : null,
      counterpart: entry.counterpart || null,
      contact: contactDoc ? formatContact(contactDoc) : null,
    };
  });
};

const buildLinkedBalanceSummaryEntry = async (config, baseBalanceMap, options = {}) => {
  const {
    recentMovementsLimit = 3,
    contactLimit = 3,
    activityLimit = 5,
    variationWindowDays = DEFAULT_VARIATION_WINDOW_DAYS,
  } = options;

  const baseBalance = baseBalanceMap.get(config.id) || {
    id: config.id,
    label: config.label,
    currency: config.currency,
    amount: 0,
    status: 'ok',
    updatedAt: new Date().toISOString(),
  };

  const [variation, totals, recentMovements, contacts, accounting, activity] = await Promise.all([
    computeVariationForBalance(config.id, { days: variationWindowDays }),
    fetchMovementTotalsForBalance(config.id),
    fetchRecentMovementsForBalance(config.id, recentMovementsLimit),
    fetchContactSummariesForBalance(config.id, contactLimit),
    fetchAccountingSummaryForBalance(config.id),
    fetchRecentActivityForBalance(config.id, activityLimit),
  ]);

  return {
    id: config.id,
    label: config.label,
    currency: config.currency,
    amount: roundAmount(baseBalance.amount || 0),
    status: baseBalance.status || 'ok',
    updatedAt: baseBalance.updatedAt || new Date().toISOString(),
    variation,
    totals,
    recentMovements,
    contacts,
    accounting,
    activity,
  };
};

const getLinkedBalancesSummary = async (options = {}) => {
  const balances = await getTreasuryBalances();
  const balanceMap = new Map(balances.map((balance) => [balance.id, balance]));

  const configs = Object.values(LINKED_BALANCE_CONFIG);
  const entries = await Promise.all(
    configs.map((config) => buildLinkedBalanceSummaryEntry(config, balanceMap, options))
  );

  return {
    generatedAt: new Date().toISOString(),
    balances: entries,
  };
};

const computeVariationPercentage = (currentValue = 0, previousValue = 0) => {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;

  if (previous === 0) {
    if (current === 0) {
      return 0;
    }
    return 100;
  }

  const raw = ((current - previous) / Math.abs(previous)) * 100;
  return roundAmount(raw);
};

const directionFromVariation = (value) => {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
};

const resolveAccountLabel = (key, currency) => {
  const config = getBalanceConfig(key);
  if (config) {
    return config.label;
  }

  if (!key) {
    return currency === 'USD' ? 'General USD' : 'General';
  }

  const normalized = String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const resolveSummaryLabel = (accountKey, currency) => {
  const normalizedAccountKey = (accountKey || '').toLowerCase();
  const normalizedCurrency = (currency || '').toUpperCase();

  const keyIncludes = (value) => normalizedAccountKey.includes(value);

  if (normalizedAccountKey === 'usd' || keyIncludes('caja_usd')) {
    return 'Caja USD';
  }

  if (keyIncludes('transfer')) {
    return normalizedCurrency === 'USD' ? 'Transferencias USD' : 'Transferencias ARS';
  }

  if (keyIncludes('cash') || keyIncludes('efectivo')) {
    return normalizedCurrency === 'USD' ? 'Efectivo USD' : 'Efectivo ARS';
  }

  if (keyIncludes('accounts_receivable') || keyIncludes('cuentas_cobrar')) {
    return normalizedCurrency === 'USD' ? 'Cuentas a Cobrar USD' : 'Cuentas a Cobrar ARS';
  }

  return resolveAccountLabel(accountKey, currency);
};

const computeBalanceState = (amount) => {
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'zero';
};

const buildOverviewMatch = (filters = {}) => {
  const match = {
    ledger: 'contact',
  };

  if (filters.currency) {
    match.currency = String(filters.currency).toUpperCase();
  }

  if (filters.accountKey) {
    match.accountKey = String(filters.accountKey).toLowerCase();
  }

  if (filters.counterpartKey) {
    match['counterpart.key'] = String(filters.counterpartKey).toLowerCase();
  }

  const dateFilters = {};
  if (filters.dateFrom) {
    const from = parseDateFilter(filters.dateFrom);
    if (from) {
      dateFilters.$gte = from;
    }
  }
  if (filters.dateTo) {
    const to = parseDateFilter(filters.dateTo, { endOfDay: true });
    if (to) {
      dateFilters.$lte = to;
    }
  }
  if (Object.keys(dateFilters).length) {
    match.createdAt = dateFilters;
  }

  return match;
};

const getGlobalBalancesOverview = async (query = {}) => {
  const {
    currency,
    accountKey,
    search,
    contactType,
    balanceState,
    dateFrom,
    dateTo,
    page = 1,
    limit = DEFAULT_GLOBAL_BALANCES_LIMIT,
    sortBy = 'balance',
    sortDirection = 'desc',
  } = query;

  const rawAccountKey = typeof accountKey === 'string' ? accountKey.trim() : '';
  let normalizedAccountKey = rawAccountKey ? rawAccountKey.toLowerCase() : '';
  let normalizedCurrency = typeof currency === 'string' && currency.trim().length
    ? currency.toUpperCase()
    : null;

  if (normalizedAccountKey.includes('::')) {
    const [baseKey, currencySuffix] = normalizedAccountKey.split('::');
    normalizedAccountKey = baseKey;
    if (!normalizedCurrency && currencySuffix) {
      normalizedCurrency = currencySuffix.toUpperCase();
    }
  }

  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.min(Math.max(Number(limit) || DEFAULT_GLOBAL_BALANCES_LIMIT, 1), 100);
  const normalizedSort =
    typeof sortBy === 'string' && GLOBAL_BALANCE_SORT_FIELDS.has(sortBy)
      ? sortBy
      : 'balance';
  const ascending = String(sortDirection).toLowerCase() === 'asc';

  const now = new Date();
  const currentWindowStart = new Date(now.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);
  const previousWindowStart = new Date(currentWindowStart.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);

  const match = buildOverviewMatch({
    currency: normalizedCurrency,
    accountKey: normalizedAccountKey,
    counterpartKey: normalizedAccountKey,
    dateFrom,
    dateTo,
  });

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        overviewAccountKey: {
          $ifNull: ['$accountKey', 'general'],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          contact: '$contact',
          currency: '$currency',
          accountKey: '$overviewAccountKey',
        },
        balance: { $sum: '$amount' },
        lastMovementAt: { $first: '$createdAt' },
        lastOperationCode: { $first: '$operation.code' },
        lastOperationType: { $first: '$operation.type' },
        currentWindowAmount: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', currentWindowStart] },
              '$amount',
              0,
            ],
          },
        },
        previousWindowAmount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$createdAt', previousWindowStart] },
                  { $lt: ['$createdAt', currentWindowStart] },
                ],
              },
              '$amount',
              0,
            ],
          },
        },
      },
    },
  ];

  const rawRows = await CurrentAccountMovement.aggregate(pipeline);

  const contactIds = rawRows
    .map((row) => row._id.contact)
    .filter((value) => value && mongoose.Types.ObjectId.isValid(value))
    .map((value) => value.toString());

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1, cuit: 1 })
        .lean()
    : [];

  const contactMap = new Map(
    contacts.map((contact) => [contact._id ? contact._id.toString() : '', contact])
  );

  const appliedSearch = typeof search === 'string' ? search.trim().toLowerCase() : '';
  const normalizedBalanceFilter = BALANCE_STATE_VALUES.includes(balanceState)
    ? balanceState
    : null;
  const normalizedContactType =
    typeof contactType === 'string' && contactType.trim().length
      ? contactType.trim().toLowerCase()
      : null;

  const formattedRows = rawRows.map((row) => {
    const contactId =
      row._id.contact && mongoose.Types.ObjectId.isValid(row._id.contact)
        ? row._id.contact.toString()
        : null;

    const contactDoc = contactId ? contactMap.get(contactId) : null;
    const fullName =
      contactDoc?.fullName || contactDoc?.shortName || (contactId ? 'Contacto sin nombre' : 'Saldo general');

    const amount = roundAmount(row.balance || 0);
    const state = computeBalanceState(amount);
    const variationChange = computeVariationPercentage(
      row.currentWindowAmount,
      row.previousWindowAmount
    );

    const accountKeyValue = row._id.accountKey || 'general';
    const currencyValue = row._id.currency || 'ARS';
    const label = resolveSummaryLabel(accountKeyValue, currencyValue);
    const meta = BALANCE_METADATA[accountKeyValue] || {};

    return {
      id: `${accountKeyValue}-${contactId || 'general'}-${currencyValue}`.toLowerCase(),
      accountKey: accountKeyValue,
      accountLabel: label,
      accountStatus: meta.status || 'ok',
      currency: currencyValue,
      amount,
      balanceState: state,
      variation: {
        percentage: variationChange,
        direction: directionFromVariation(variationChange),
        currentWindowAmount: roundAmount(row.currentWindowAmount || 0),
        previousWindowAmount: roundAmount(row.previousWindowAmount || 0),
      },
      lastMovementAt: row.lastMovementAt ? new Date(row.lastMovementAt).toISOString() : null,
      lastOperation: {
        code: row.lastOperationCode || null,
        type: row.lastOperationType || null,
      },
      contact: contactId
        ? {
            id: contactId,
            fullName,
            shortName: contactDoc?.shortName || null,
            contactType: contactDoc?.contactType || 'client',
            status: contactDoc?.status || 'active',
            cuit: contactDoc?.cuit || null,
          }
        : {
            id: null,
            fullName,
            shortName: fullName,
            contactType: 'general',
            status: 'active',
            cuit: null,
          },
    };
  });

  const filteredBySearch = appliedSearch
    ? formattedRows.filter((row) => {
        const haystack = [
          row.contact?.fullName || '',
          row.contact?.shortName || '',
          row.contact?.cuit || '',
          row.accountLabel,
          row.lastOperation?.code || '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(appliedSearch);
      })
    : formattedRows;

  const filteredByState = normalizedBalanceFilter
    ? filteredBySearch.filter((row) => row.balanceState === normalizedBalanceFilter)
    : filteredBySearch;

  const fullyFiltered = normalizedContactType
    ? filteredByState.filter(
        (row) =>
          (row.contact?.contactType || '').toLowerCase() === normalizedContactType ||
          (normalizedContactType === 'cliente' && row.contact?.contactType === 'client') ||
          (normalizedContactType === 'proveedor' && row.contact?.contactType === 'provider')
      )
    : filteredByState;

  const sortMultiplier = ascending ? 1 : -1;
  const sortedRows = [...fullyFiltered].sort((a, b) => {
    switch (normalizedSort) {
      case 'name': {
        const nameA = (a.contact?.fullName || '').toLowerCase();
        const nameB = (b.contact?.fullName || '').toLowerCase();
        if (nameA < nameB) return -1 * sortMultiplier;
        if (nameA > nameB) return 1 * sortMultiplier;
        return 0;
      }
      case 'variation': {
        const valueA = a.variation?.percentage ?? 0;
        const valueB = b.variation?.percentage ?? 0;
        return (valueA - valueB) * sortMultiplier;
      }
      case 'lastMovement': {
        const dateA = a.lastMovementAt ? new Date(a.lastMovementAt).getTime() : 0;
        const dateB = b.lastMovementAt ? new Date(b.lastMovementAt).getTime() : 0;
        return (dateA - dateB) * sortMultiplier;
      }
      case 'balance':
      default: {
        return (a.amount - b.amount) * sortMultiplier;
      }
    }
  });

  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / numericLimit));
  const startIndex = (numericPage - 1) * numericLimit;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + numericLimit);

  const summaryByAccount = new Map();
  const currencies = new Set();
  const accountKeys = new Map();
  const contactTypesSet = new Set();
  const balanceStatesCount = {
    positive: 0,
    negative: 0,
    zero: 0,
  };

  for (const row of fullyFiltered) {
    currencies.add(row.currency);

    const summaryKey = `${row.accountKey || 'general'}::${row.currency || 'ARS'}`.toLowerCase();
    const summaryLabel = resolveSummaryLabel(row.accountKey, row.currency);

    accountKeys.set(summaryKey, summaryLabel);
    if (row.contact?.contactType) {
      contactTypesSet.add(row.contact.contactType);
    }
    if (BALANCE_STATE_VALUES.includes(row.balanceState)) {
      balanceStatesCount[row.balanceState] += 1;
    }

    if (!summaryByAccount.has(summaryKey)) {
      summaryByAccount.set(summaryKey, {
        id: summaryKey,
        accountKey: row.accountKey,
        label: summaryLabel,
        currency: row.currency,
        status: row.accountStatus || 'ok',
        amount: 0,
        updatedAt: row.lastMovementAt,
        currentWindowAmount: 0,
        previousWindowAmount: 0,
      });
    }
    const entry = summaryByAccount.get(summaryKey);
    entry.amount = roundAmount((entry.amount || 0) + row.amount);
    entry.currentWindowAmount = roundAmount(
      (entry.currentWindowAmount || 0) + (row.variation?.currentWindowAmount || 0)
    );
    entry.previousWindowAmount = roundAmount(
      (entry.previousWindowAmount || 0) + (row.variation?.previousWindowAmount || 0)
    );
    if (
      row.lastMovementAt &&
      (!entry.updatedAt || new Date(row.lastMovementAt).getTime() > new Date(entry.updatedAt).getTime())
    ) {
      entry.updatedAt = row.lastMovementAt;
    }
  }

  const summaryCards = Array.from(summaryByAccount.values())
    .filter((entry) => {
      const key = (entry.accountKey || '').toLowerCase();
      return key && !SUMMARY_EXCLUDED_ACCOUNT_KEYS.has(key);
    })
    .map((entry) => {
      const variationPercentage = computeVariationPercentage(
        entry.currentWindowAmount,
        entry.previousWindowAmount
      );
      return {
        id: entry.id,
        label: entry.label,
        currency: entry.currency,
        amount: roundAmount(entry.amount),
        status: entry.status,
        updatedAt: entry.updatedAt,
        variation: {
          percentage: variationPercentage,
          direction: directionFromVariation(variationPercentage),
          windowDays: DEFAULT_VARIATION_WINDOW_DAYS,
        },
      };
    });

  summaryCards.sort((a, b) => {
    const order = [
      'usd::usd',
      'transfers::usd',
      'accounts_receivable::usd',
      'courier_in_transit::usd',
      'cash::ars',
      'transfers::ars',
      'accounts_receivable::ars',
      'courier_in_transit::ars',
    ];
    const indexA = order.indexOf(a.id);
    const indexB = order.indexOf(b.id);
    if (indexA === -1 && indexB === -1) {
      return a.label.localeCompare(b.label);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const totalBalance = roundAmount(
    fullyFiltered.reduce((acc, row) => acc + (row.amount || 0), 0)
  );

  const totalsByCurrency = Array.from(currencies).map((currencyValue) => ({
    currency: currencyValue,
    total: roundAmount(
      fullyFiltered
        .filter((row) => row.currency === currencyValue)
        .reduce((acc, row) => acc + (row.amount || 0), 0)
    ),
  }));

  const filterOptions = {
    currencies: Array.from(currencies).map((value) => ({
      value,
      label: value,
    })),
  accountKeys: Array.from(accountKeys.entries()).map(([value, label]) => ({
    value,
    label,
  })),
    balanceStates: BALANCE_STATE_VALUES.map((value) => ({
      value,
      label:
        value === 'positive'
          ? 'Saldos positivos'
          : value === 'negative'
          ? 'Saldos negativos'
          : 'Saldos en cero',
    })),
    contactTypes: Array.from(contactTypesSet).map((value) => ({
      value,
      label:
        value === 'client'
          ? 'Cliente'
          : value === 'provider'
          ? 'Proveedor'
          : value.charAt(0).toUpperCase() + value.slice(1),
    })),
  };

  return {
    generatedAt: new Date().toISOString(),
    summaryCards,
    filters: filterOptions,
    table: {
      items: paginatedRows,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        totalItems,
        totalPages,
      },
    },
    stats: {
      totalBalance,
      balanceStates: balanceStatesCount,
      totalsByCurrency,
    },
    appliedFilters: {
      currency: normalizedCurrency || null,
      accountKey: rawAccountKey || null,
      contactType: normalizedContactType,
      balanceState: normalizedBalanceFilter,
      search: appliedSearch || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    },
  };
};

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const STATUS_LABELS = {
  registered: 'Registrada',
  settled: 'Compensada',
  pending: 'Pendiente',
};

const mapStageToStatus = (stage, metadataStatus) => {
  const normalizedStage = typeof stage === 'string' ? stage.toLowerCase() : '';
  const normalizedMetadata = typeof metadataStatus === 'string' ? metadataStatus.toLowerCase() : '';

  if (normalizedMetadata === 'pending') {
    return { key: 'pending', label: STATUS_LABELS.pending };
  }

  if (normalizedStage === 'settlement') {
    return { key: 'settled', label: STATUS_LABELS.settled };
  }

  if (normalizedStage === 'registration') {
    return { key: 'registered', label: STATUS_LABELS.registered };
  }

  if (normalizedStage) {
    return {
      key: normalizedStage,
      label: STATUS_LABELS[normalizedStage] || normalizedStage,
    };
  }

  if (normalizedMetadata) {
    return {
      key: normalizedMetadata,
      label: STATUS_LABELS[normalizedMetadata] || normalizedMetadata,
    };
  }

  return { key: 'unknown', label: 'Desconocido' };
};

const normalizeContactStatusFilter = (value) => {
  if (!value) {
    return null;
  }
  const normalized = String(value).toLowerCase();

  if (['registrada', 'registered', 'registration'].includes(normalized)) {
    return { stage: 'registration' };
  }
  if (['compensada', 'settled', 'settlement', 'compensado'].includes(normalized)) {
    return { stage: 'settlement' };
  }
  if (['pendiente', 'pending'].includes(normalized)) {
    return { metadataStatus: 'pending' };
  }
  return { stage: normalized };
};

const buildContactMovementMatch = (contactId, filters = {}) => {
  const match = {
    ledger: 'contact',
    contact: contactId,
  };

  if (filters.accountKey) {
    match.accountKey = String(filters.accountKey).toLowerCase();
  }

  if (filters.currency) {
    match.currency = String(filters.currency).toUpperCase();
  }

  const statusFilter = normalizeContactStatusFilter(filters.status);
  const andConditions = [];

  if (statusFilter?.stage) {
    match.stage = statusFilter.stage;
  }
  if (statusFilter?.metadataStatus) {
    andConditions.push({ 'metadata.status': statusFilter.metadataStatus });
  }

  if (filters.operationType) {
    andConditions.push({
      'operation.type': {
        $regex: new RegExp(escapeRegex(filters.operationType), 'i'),
      },
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    const range = {};
    const from = parseDateFilter(filters.dateFrom);
    const to = parseDateFilter(filters.dateTo, { endOfDay: true });
    if (from) {
      range.$gte = from;
    }
    if (to) {
      range.$lte = to;
    }
    if (Object.keys(range).length) {
      match.createdAt = range;
    }
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    andConditions.push({
      $or: [
        { 'operation.code': regex },
        { 'operation.type': regex },
        { 'operation.source': regex },
        { 'metadata.reference': regex },
        { reference: regex },
      ],
    });
  }

  if (andConditions.length) {
    match.$and = andConditions;
  }

  return match;
};

const buildContactFilterOptions = (operationTypes = [], currencies = [], stages = [], metadataStatuses = []) => {
  const operationTypeOptions = operationTypes
    .filter(Boolean)
    .map((value) => ({ value, label: value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const currencyOptions = currencies
    .filter(Boolean)
    .map((value) => ({ value, label: value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const statusKeys = new Set();
  stages.filter(Boolean).forEach((stage) => {
    const { key } = mapStageToStatus(stage);
    if (key !== 'unknown') {
      statusKeys.add(key);
    }
  });
  metadataStatuses.filter(Boolean).forEach((metadataStatus) => {
    const { key } = mapStageToStatus(null, metadataStatus);
    if (key !== 'unknown') {
      statusKeys.add(key);
    }
  });

  const statusOptions = Array.from(statusKeys)
    .map((key) => ({ value: key, label: STATUS_LABELS[key] || key }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    operationTypes: operationTypeOptions,
    currencies: currencyOptions,
    statuses: statusOptions,
  };
};

const getContactBalanceDetail = async (contactIdInput, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(contactIdInput)) {
    throw new AppError('El contacto indicado no es válido.', 400, {
      code: 'INVALID_CONTACT_ID',
    });
  }

  const contact = await Client.findById(contactIdInput)
    .select({ fullName: 1, shortName: 1, contactType: 1, status: 1, cuit: 1 })
    .lean();

  if (!contact) {
    throw new AppError('El contacto indicado no existe.', 404, {
      code: 'CONTACT_NOT_FOUND',
    });
  }

  const contactId = new mongoose.Types.ObjectId(contactIdInput);

  const {
    currency,
    operationType,
    status,
    dateFrom,
    dateTo,
    search,
    accountKey,
    page = 1,
    limit = CONTACT_BALANCE_DEFAULT_LIMIT,
    sortBy = 'date',
    sortDirection = 'desc',
  } = query;

  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.min(Math.max(Number(limit) || CONTACT_BALANCE_DEFAULT_LIMIT, 1), 100);
  const normalizedSortBy = CONTACT_BALANCE_SORT_FIELDS.has(sortBy) ? sortBy : 'date';
  const normalizedSortDirection = sortDirection === 'asc' ? 'asc' : 'desc';

  const filters = {
    currency,
    operationType,
    status,
    dateFrom,
    dateTo,
    search,
    accountKey,
  };

  const match = buildContactMovementMatch(contactId, filters);

  const sortStage = {};
  if (normalizedSortBy === 'amount') {
    sortStage.amount = normalizedSortDirection === 'asc' ? 1 : -1;
    sortStage.createdAt = normalizedSortDirection === 'asc' ? 1 : -1;
  } else if (normalizedSortBy === 'type') {
    sortStage['operation.type'] = normalizedSortDirection === 'asc' ? 1 : -1;
    sortStage.createdAt = normalizedSortDirection === 'asc' ? 1 : -1;
  } else {
    sortStage.createdAt = normalizedSortDirection === 'asc' ? 1 : -1;
  }

  const skip = (numericPage - 1) * numericLimit;

  const [totalItems, operations, aggregatedTotals, totalsByCurrency, filterSource] = await Promise.all([
    CurrentAccountMovement.countDocuments(match),
    CurrentAccountMovement.find(match)
      .sort(sortStage)
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    CurrentAccountMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amount' },
          incoming: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
            },
          },
          incomingCount: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, 1, 0],
            },
          },
          outgoing: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, '$amount', 0],
            },
          },
          outgoingCount: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, 1, 0],
            },
          },
          lastMovementAt: { $max: '$createdAt' },
        },
      },
    ]),
    CurrentAccountMovement.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' },
          incoming: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
            },
          },
          incomingCount: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, 1, 0],
            },
          },
          outgoing: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, '$amount', 0],
            },
          },
          outgoingCount: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CurrentAccountMovement.aggregate([
      {
        $match: buildContactMovementMatch(contactId, {
          accountKey,
        }),
      },
      {
        $group: {
          _id: null,
          operationTypes: { $addToSet: '$operation.type' },
          currencies: { $addToSet: '$currency' },
          stages: { $addToSet: '$stage' },
          metadataStatuses: { $addToSet: '$metadata.status' },
        },
      },
    ]),
  ]);

  const totalsEntry = aggregatedTotals[0] || {
    balance: 0,
    incoming: 0,
    incomingCount: 0,
    outgoing: 0,
    outgoingCount: 0,
    lastMovementAt: null,
  };

  const overallTotals = {
    balance: roundAmount(totalsEntry.balance || 0),
    incoming: {
      amount: roundAmount(Math.abs(totalsEntry.incoming || 0)),
      count: totalsEntry.incomingCount || 0,
    },
    outgoing: {
      amount: roundAmount(Math.abs(totalsEntry.outgoing || 0)),
      count: totalsEntry.outgoingCount || 0,
    },
    net: roundAmount((totalsEntry.incoming || 0) + (totalsEntry.outgoing || 0)),
    lastMovementAt: totalsEntry.lastMovementAt
      ? new Date(totalsEntry.lastMovementAt).toISOString()
      : null,
  };

  const currencyTotals = totalsByCurrency.map((entry) => {
    const incomingRaw = entry.incoming || 0;
    const outgoingRaw = entry.outgoing || 0;
    return {
      currency: entry._id,
      balance: roundAmount(entry.total || 0),
      totals: {
        incoming: {
          amount: roundAmount(Math.abs(incomingRaw)),
          count: entry.incomingCount || 0,
        },
        outgoing: {
          amount: roundAmount(Math.abs(outgoingRaw)),
          count: entry.outgoingCount || 0,
        },
        net: roundAmount(incomingRaw + outgoingRaw),
      },
    };
  });

  const optionsDoc = filterSource[0] || {
    operationTypes: [],
    currencies: [],
    stages: [],
    metadataStatuses: [],
  };

  const filterOptions = buildContactFilterOptions(
    optionsDoc.operationTypes,
    optionsDoc.currencies,
    optionsDoc.stages,
    optionsDoc.metadataStatuses
  );

  const operationsList = operations.map((operation) => {
    const amount = roundAmount(operation.amount || 0);
    const isIncoming = amount >= 0;
    const status = mapStageToStatus(operation.stage, operation.metadata?.status);
    const rawOperationId = operation.operation?.id;
    const operationId =
      rawOperationId && typeof rawOperationId === 'object' && rawOperationId.toString
        ? rawOperationId.toString()
        : rawOperationId || null;
    return {
      id: operation._id ? operation._id.toString() : null,
      createdAt: operation.createdAt ? new Date(operation.createdAt).toISOString() : null,
      currency: operation.currency,
      amount,
      direction: isIncoming ? 'incoming' : 'outgoing',
      operation: {
        id: operationId,
        type: operation.operation?.type || operation.metadata?.operationType || 'Operación',
        code: operation.operation?.code || null,
        source: operation.operation?.source || null,
      },
      status,
    };
  });

  let variation = null;
  if (!dateFrom && !dateTo) {
    const now = new Date();
    const currentWindowStart = new Date(now.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);
    const previousWindowStart = new Date(currentWindowStart.getTime() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY);

    const baseMatchWithoutDate = buildContactMovementMatch(contactId, {
      currency,
      operationType,
      status,
      search,
      accountKey,
    });
    if (baseMatchWithoutDate.createdAt) {
      delete baseMatchWithoutDate.createdAt;
    }

    const currentMatch = {
      ...baseMatchWithoutDate,
      createdAt: { $gte: currentWindowStart },
    };

    const previousMatch = {
      ...baseMatchWithoutDate,
      createdAt: {
        $gte: previousWindowStart,
        $lt: currentWindowStart,
      },
    };

    const [currentWindowTotals, previousWindowTotals] = await Promise.all([
      CurrentAccountMovement.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: null,
            net: { $sum: '$amount' },
          },
        },
      ]),
      CurrentAccountMovement.aggregate([
        { $match: previousMatch },
        {
          $group: {
            _id: null,
            net: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const currentNet = currentWindowTotals[0]?.net || 0;
    const previousNet = previousWindowTotals[0]?.net || 0;
    const variationPercentage = computeVariationPercentage(currentNet, previousNet);
    variation = {
      windowDays: DEFAULT_VARIATION_WINDOW_DAYS,
      percentage: variationPercentage,
      direction: directionFromVariation(variationPercentage),
      currentPeriodNet: roundAmount(currentNet),
      previousPeriodNet: roundAmount(previousNet),
    };
  }

  const normalizedCurrencyTotals = currencyTotals.length
    ? currencyTotals
    : [
        {
          currency: currency ? String(currency).toUpperCase() : 'ARS',
          balance: overallTotals.balance,
          totals: {
            incoming: {
              amount: overallTotals.incoming.amount,
              count: overallTotals.incoming.count,
            },
            outgoing: {
              amount: overallTotals.outgoing.amount,
              count: overallTotals.outgoing.count,
            },
            net: overallTotals.net,
          },
        },
      ];

  const primaryCurrency = currency
    ? String(currency).toUpperCase()
    : normalizedCurrencyTotals[0]?.currency || 'ARS';

  const primaryTotalsEntry = normalizedCurrencyTotals.find(
    (entry) => entry.currency === primaryCurrency
  ) || normalizedCurrencyTotals[0] || {
    currency: primaryCurrency,
    balance: 0,
    totals: {
      incoming: { amount: 0, count: 0 },
      outgoing: { amount: 0, count: 0 },
      net: 0,
    },
  };

  const summaryTotals = {
    balance: primaryTotalsEntry.balance,
    incoming: primaryTotalsEntry.totals.incoming,
    outgoing: primaryTotalsEntry.totals.outgoing,
    net: primaryTotalsEntry.totals.net,
    lastMovementAt: overallTotals.lastMovementAt,
  };

  return {
    contact: {
      id: contact._id ? contact._id.toString() : contactIdInput,
      fullName: contact.fullName,
      shortName: contact.shortName || contact.fullName,
      contactType: contact.contactType || 'client',
      status: contact.status || 'active',
      cuit: contact.cuit || null,
      updatedAt: overallTotals.lastMovementAt,
    },
    summary: {
      balance: {
        amount: summaryTotals.balance,
        currency: primaryCurrency,
      },
      variation,
      totals: summaryTotals,
      totalsByCurrency: normalizedCurrencyTotals,
    },
    filters: {
      options: filterOptions,
      applied: {
        currency: currency || null,
        operationType: operationType || null,
        status: status || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        search: search || null,
      },
    },
    table: {
      items: operationsList,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / numericLimit)),
      },
      sort: {
        sortBy: normalizedSortBy,
        sortDirection: normalizedSortDirection,
      },
    },
    stats: {
      totalsByCurrency: normalizedCurrencyTotals,
      totalOperations: totalItems,
    },
  };
};

const getLinkedBalanceDetail = async (keyInput, options = {}) => {
  const config = getBalanceConfig(keyInput);
  if (!config) {
    throw new AppError('La cuenta indicada no existe.', 404);
  }

  const {
    dateFrom,
    dateTo,
    type,
    contactId,
    page = 1,
    limit = 20,
    recentMovementsLimit = 3,
    contactLimit = 5,
    activityLimit = 8,
  } = options;

  const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const sanitizedPage = Math.max(Number(page) || 1, 1);

  if (contactId && !mongoose.Types.ObjectId.isValid(contactId)) {
    throw new AppError('El contacto indicado no es válido.', 400);
  }

  const match = buildMovementMatch(config.id, { dateFrom, dateTo, type, contactId });

  const [totalItems, movements] = await Promise.all([
    TreasuryMovement.countDocuments(match),
    TreasuryMovement.find(match)
      .sort({ movementAt: -1 })
      .skip((sanitizedPage - 1) * sanitizedLimit)
      .limit(sanitizedLimit)
      .lean(),
  ]);

  const contactIds = movements
    .map((movement) => movement.contact)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => id.toString());

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1, email: 1 })
        .lean()
    : [];

  const formattedMovements = movements.map((movement) =>
    formatTreasuryMovement(movement, contacts)
  );

  const [totals, overallTotals, variation, summaryEntry] = await Promise.all([
    fetchMovementTotalsForBalance(config.id, { dateFrom, dateTo, type, contactId }),
    fetchMovementTotalsForBalance(config.id),
    computeVariationForBalance(config.id),
    (async () => {
      const baseBalances = await getTreasuryBalances();
      const baseMap = new Map(baseBalances.map((balance) => [balance.id, balance]));
      return buildLinkedBalanceSummaryEntry(config, baseMap, {
        recentMovementsLimit,
        contactLimit,
        activityLimit,
      });
    })(),
  ]);

  const [contactsBreakdown, recentActivity, recentMovements] = await Promise.all([
    fetchContactSummariesForBalance(config.id, contactLimit, { dateFrom, dateTo, type, contactId }),
    fetchRecentActivityForBalance(config.id, activityLimit),
    fetchRecentMovementsForBalance(config.id, recentMovementsLimit, { dateFrom, dateTo, type }),
  ]);

  return {
    balance: {
      id: summaryEntry.id,
      label: summaryEntry.label,
      currency: summaryEntry.currency,
      amount: summaryEntry.amount,
      status: summaryEntry.status,
      updatedAt: summaryEntry.updatedAt,
      variation,
    },
    filters: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      type: typeof type === 'string' ? type : null,
      contactId: contactId || null,
      defaults: {
        dateFrom: new Date(Date.now() - DEFAULT_VARIATION_WINDOW_DAYS * MS_IN_DAY)
          .toISOString()
          .split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
      },
    },
    totals,
    overallTotals,
    movements: {
      items: formattedMovements,
      pagination: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / sanitizedLimit)),
      },
    },
    contacts: contactsBreakdown,
    activity: recentActivity,
    recentMovements,
  };
};

const roundAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
};

const normalizeBalanceKey = (movementType) => {
  if (movementType === 'courier_in_transit') {
    return 'courier_in_transit';
  }
  if (movementType === 'cash') {
    return 'cash';
  }
  if (movementType === 'usd') {
    return 'usd';
  }
  return 'transfers';
};

const resolveMovementBalanceType = (currency, medium) => {
  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'ARS';
  if (normalizedCurrency === 'USD') {
    return 'usd';
  }
  return medium === 'cash' ? 'cash' : 'transfer';
};

const ensureBalance = async (key, currency, { amount = 0, session } = {}) => {
  await TreasuryBalance.updateOne(
    { key, currency },
    {
      $setOnInsert: {
        key,
        currency,
        amount,
      },
    },
    { upsert: true, session }
  );
};

const adjustTreasuryBalanceForMovement = async (
  movementType,
  currency,
  delta,
  { userId, session } = {}
) => {
  const key = normalizeBalanceKey(movementType);
  const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'ARS';
  const numericDelta = Number(delta);

  if (!Number.isFinite(numericDelta) || numericDelta === 0) {
    return TreasuryBalance.findOne({ key, currency: normalizedCurrency })
      .session(session || null)
      .lean();
  }

  await ensureBalance(key, normalizedCurrency, { session });

  const balance =
    (await TreasuryBalance.findOne({ key, currency: normalizedCurrency }).session(session || null)) ||
    new TreasuryBalance({ key, currency: normalizedCurrency, amount: 0 });

  const currentAmount = Number(balance.amount) || 0;
  const nextAmount = Math.round((currentAmount + numericDelta) * 100) / 100;
  balance.amount = nextAmount;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    balance.updatedBy = userId;
  }

  await balance.save({ session });

  return balance.toObject();
};

const formatBalance = (balance) => {
  if (!balance) {
    return null;
  }
  const meta = BALANCE_METADATA[balance.key] || {
    label: balance.key,
    status: 'ok',
  };
  return {
    id: balance.key,
    label: meta.label,
    currency: balance.currency,
    amount: Number(Number(balance.amount || 0).toFixed(2)),
    status: meta.status,
    updatedAt: (balance.updatedAt || balance.createdAt || new Date()).toISOString(),
  };
};

const formatCurrencyAmount = (amount, currency) => {
  const numeric = roundAmount(amount);
  const suffix = currency ? ` ${String(currency).toUpperCase()}` : '';
  return `${numeric}${suffix}`.trim();
};

const parseThresholdValue = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const BALANCE_ALERT_THRESHOLDS = {
  transfers: {
    min: parseThresholdValue(process.env.TREASURY_THRESHOLD_TRANSFERS_MIN),
    max: parseThresholdValue(process.env.TREASURY_THRESHOLD_TRANSFERS_MAX),
  },
  cash: {
    min: parseThresholdValue(process.env.TREASURY_THRESHOLD_CASH_MIN),
    max: parseThresholdValue(process.env.TREASURY_THRESHOLD_CASH_MAX),
  },
  usd: {
    min: parseThresholdValue(process.env.TREASURY_THRESHOLD_USD_MIN),
    max: parseThresholdValue(process.env.TREASURY_THRESHOLD_USD_MAX),
  },
  courier_in_transit: {
    min: parseThresholdValue(process.env.TREASURY_THRESHOLD_COURIER_MIN),
    max: parseThresholdValue(process.env.TREASURY_THRESHOLD_COURIER_MAX),
  },
};

const balanceAlertState = new Map();

const buildBalanceAlertKey = (balanceKey, currency) =>
  `${String(balanceKey || '').toLowerCase()}:${String(currency || 'ARS').toUpperCase()}`;

const resolveBalanceThresholdConfig = (balanceKey, currency) => {
  const normalizedKey = String(balanceKey || '').toLowerCase();
  const normalizedCurrency = String(currency || 'ARS').toUpperCase();
  const directKey = `${normalizedKey}:${normalizedCurrency}`;
  const config =
    BALANCE_ALERT_THRESHOLDS[directKey] || BALANCE_ALERT_THRESHOLDS[normalizedKey] || null;

  if (!config) {
    return null;
  }

  const min = parseThresholdValue(config.min);
  const max = parseThresholdValue(config.max);

  if (min == null && max == null) {
    return null;
  }

  return { min, max };
};

const buildBalancesActionUrl = (balanceKey) =>
  `/dashboard/tesoreria/saldos?account=${encodeURIComponent(String(balanceKey || 'general'))}`;

const evaluateBalanceAlerts = (balance, { performedBy } = {}) => {
  if (!balance) {
    return;
  }

  const balanceKey = balance.key || balance.id || balance.balanceKey;
  const config = resolveBalanceThresholdConfig(balanceKey, balance.currency);
  if (!config) {
    balanceAlertState.delete(buildBalanceAlertKey(balanceKey, balance.currency));
    return;
  }

  const amount = Number(balance.amount) || 0;
  const alertKey = buildBalanceAlertKey(balanceKey, balance.currency);
  const previous = balanceAlertState.get(alertKey) || { low: false, high: false };
  const low = config.min != null && amount <= config.min;
  const high = config.max != null && amount >= config.max;

  balanceAlertState.set(alertKey, { low, high });

  const accountLabel = resolveAccountLabel(balanceKey, balance.currency);
  const alerts = [];

  if (low && !previous.low) {
    alerts.push({
      title: 'Alerta de saldo bajo',
      threshold: config.min,
      direction: 'low',
    });
  }

  if (high && !previous.high) {
    alerts.push({
      title: 'Alerta de saldo alto',
      threshold: config.max,
      direction: 'high',
    });
  }

  if (!alerts.length) {
    return;
  }

  alerts.forEach((alert) => {
    const thresholdLabel =
      alert.threshold == null
        ? 'sin umbral definido'
        : formatCurrencyAmount(alert.threshold, balance.currency);

    emitNotification({
      title: alert.title,
      message: `${accountLabel} quedo en ${formatCurrencyAmount(
        amount,
        balance.currency
      )} (umbral ${thresholdLabel}).`,
      severity: 'warning',
      actionLabel: 'Ver saldos',
      actionUrl: buildBalancesActionUrl(balanceKey),
      metadata: {
        balanceKey,
        currency: balance.currency,
        amount: roundAmount(amount),
        threshold: alert.threshold,
        direction: alert.direction,
        performedBy: performedBy || null,
      },
      context: {
        type: 'treasury_balance',
        id: alertKey,
        path: buildBalancesActionUrl(balanceKey),
      },
    });
  });
};

const buildMovementActionUrl = (movementId) =>
  movementId ? `/dashboard/tesoreria/movimientos/${movementId}` : '/dashboard/tesoreria';

const describeMovementMedium = (medium) => {
  if (medium === 'cash') return 'efectivo';
  if (medium === 'deposit') return 'deposito';
  return 'transferencia';
};

const emitTreasuryMovementNotification = (
  movement,
  { event, balanceSnapshot = null, userId = null, reason = null } = {}
) => {
  if (!movement || !event) {
    return;
  }

  const code = movement.movementCode || movement.id;
  const directionLabel = movement.type === 'incoming' ? 'ingreso' : 'egreso';
  const mediumLabel = describeMovementMedium(movement.medium);
  const accountLabel = resolveAccountLabel(movement.balanceKey, movement.currency);
  const amountLabel = formatCurrencyAmount(movement.amount, movement.currency);

  let title = null;
  let message = null;
  let severity = 'info';

  if (event === 'registered') {
    title = 'Movimiento de tesoreria registrado';
    message = `Se registro ${directionLabel} de ${amountLabel} (${mediumLabel}) en ${accountLabel} (${code}).`;
  } else if (event === 'compensated') {
    title = 'Movimiento compensado';
    message = `El movimiento ${code} fue compensado por ${amountLabel} en ${accountLabel}.`;
    severity = 'success';
  } else if (event === 'cancelled') {
    title = 'Movimiento anulado';
    const reasonSuffix = reason ? ` (${reason})` : '';
    message = `El movimiento ${code} fue anulado${reasonSuffix}.`;
    severity = 'warning';
  }

  if (!title || !message) {
    return;
  }

  emitNotification({
    title,
    message,
    severity,
    actionLabel: 'Ver movimiento',
    actionUrl: buildMovementActionUrl(movement.id),
    metadata: {
      movementId: movement.id,
      movementCode: movement.movementCode || null,
      amount: roundAmount(movement.amount),
      currency: movement.currency,
      balanceKey: movement.balanceKey,
      status: movement.status,
      contactId: movement.contact?.id || null,
      contactName: movement.contact?.fullName || movement.contact?.shortName || null,
      performedBy: userId || null,
      reason: reason || null,
      balanceAfter: balanceSnapshot ? formatBalance(balanceSnapshot) : null,
    },
    recipients: userId ? [{ user: userId }] : [],
    context: {
      type: 'treasury_movement',
      id: movement.id,
      path: buildMovementActionUrl(movement.id),
    },
  });
};

const emitTreasuryMovementSideEffects = (sideEffects = {}) => {
  const {
    movement,
    balanceSnapshot = null,
    movementDelta,
    userId = null,
    skipBalanceEvent = false,
  } = sideEffects || {};

  if (!movement) {
    return;
  }

  const computedDelta =
    Number.isFinite(movementDelta)
      ? movementDelta
      : movement.type === 'incoming'
      ? roundAmount(movement.amount || 0)
      : -roundAmount(movement.amount || 0);

  if (!skipBalanceEvent) {
    emitBalanceUpdated({
      source: 'treasury_movement',
      movementId: movement?.id || null,
      movementCode: movement?.movementCode || null,
      balanceKey: movement?.balanceKey || null,
      currency: movement?.currency || null,
      delta: computedDelta,
      emittedBy: userId || null,
    });
  }

  emitTreasuryMovementNotification(movement, {
    event: 'registered',
    balanceSnapshot,
    userId: userId || null,
  });
  evaluateBalanceAlerts(balanceSnapshot, { performedBy: userId });
};

const toObjectId = (value) =>
  value && mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const ensureActionUser = (context = {}) => {
  const userId = context.userId || context.user?._id || context.user?.id;
  if (!userId) {
    throw new AppError('Autenticación requerida.', 401);
  }
  return userId;
};

const computeReceptionTotals = (order) => {
  if (!order) {
    return { totalsByCurrency: [], totalAmount: 0 };
  }
  const map = new Map();
  (order.items || []).forEach((item) => {
    const currency = String(item?.assetCode || 'ARS').toUpperCase();
    const amount = roundAmount(
      Number(
        item?.receivedAmount ??
          item?.pendingAmount ??
          item?.expectedAmount ??
          0
      )
    );
    if (!amount) {
      return;
    }
    map.set(currency, roundAmount((map.get(currency) || 0) + amount));
  });
  const totalsByCurrency = Array.from(map.entries()).map(([currency, amount]) => ({
    currency,
    amount,
  }));
  const totalAmount = roundAmount(
    totalsByCurrency.reduce((acc, entry) => acc + (Number(entry.amount) || 0), 0)
  );
  return { totalsByCurrency, totalAmount };
};

const adjustCourierTransitBalance = async (order, totalsInput, context = {}, deltaSign = 1) => {
  const totals = totalsInput || computeReceptionTotals(order);
  const entries = Array.isArray(totals.totalsByCurrency) ? totals.totalsByCurrency : [];

  for (const entry of entries) {
    const amount = roundAmount(entry?.amount || 0);
    if (!amount) {
      continue;
    }
    const currency = String(entry?.currency || 'ARS').toUpperCase();
    const delta = deltaSign * amount;
    await adjustTreasuryBalanceForMovement('courier_in_transit', currency, delta, {
      userId: context.userId,
    });
    emitBalanceDelta({
      key: 'courier_in_transit',
      currency,
      delta,
      orderId: order?._id || order?.id || null,
      status: order?.treasuryReceptionStatus || null,
      userId: context.userId || null,
    });
  }

  return totals;
};

const reserveCourierTransitBalance = async (order, totals, context = {}) =>
  adjustCourierTransitBalance(order, totals, context, 1);

const releaseCourierTransitBalance = async (order, totals, context = {}) =>
  adjustCourierTransitBalance(order, totals, context, -1);

const buildReceptionCurrencyTotals = (items = []) => {
  const totals = new Map();

  (items || []).forEach((item) => {
    const currency = String(item?.assetCode || item?.currency || 'ARS').toUpperCase();
    const current = totals.get(currency) || {
      expectedAmount: 0,
      receivedAmount: 0,
      pendingAmount: 0,
    };
    current.expectedAmount += Number(item?.expectedAmount || 0);
    current.receivedAmount += Number(item?.receivedAmount || 0);
    current.pendingAmount += Number(item?.pendingAmount || 0);
    totals.set(currency, current);
  });

  return Array.from(totals.entries()).map(([currency, amounts]) => ({
    currency,
    expectedAmount: roundAmount(amounts.expectedAmount),
    receivedAmount: roundAmount(amounts.receivedAmount),
    pendingAmount: roundAmount(amounts.pendingAmount),
  }));
};

const formatReceptionEvents = (events = []) =>
  events
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((event) => {
      const userId = event?.user ? event.user.toString() : null;
      const userName = event?.userName || null;
      const baseMetadata =
        event?.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
          ? event.metadata
          : {};
      const totalsByCurrency = Array.isArray(event?.totalsByCurrency)
        ? event.totalsByCurrency.map((entry) => ({
            currency: (entry?.currency || '').toUpperCase(),
            amount: roundAmount(entry?.amount || 0),
          }))
        : Array.isArray(baseMetadata.totalsByCurrency)
        ? baseMetadata.totalsByCurrency
        : [];

      return {
        id: event?._id ? event._id.toString() : null,
        type: event?.type || null,
        user: userId || userName ? { id: userId, fullName: userName, avatarUrl: null } : null,
        userId,
        userName,
        timestamp: event?.createdAt ? new Date(event.createdAt).toISOString() : null,
        metadata: {
          ...baseMetadata,
          reason: event?.reason || baseMetadata.reason || null,
          notes: event?.notes || baseMetadata.notes || null,
          ip: event?.ip || baseMetadata.ip || null,
          userAgent: event?.userAgent || baseMetadata.userAgent || null,
          totalsByCurrency,
        },
      };
    });

const formatReception = (order, totalsOverride) => {
  if (!order) {
    return null;
  }
  const plain = order.toObject ? order.toObject() : order;
  const totals = totalsOverride || computeReceptionTotals(plain);
  const completedAt = plain.completedAt ? new Date(plain.completedAt).toISOString() : null;
  const createdAt = plain.createdAt ? new Date(plain.createdAt).toISOString() : null;
  const updatedAt = plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null;
  const courierId = plain.messengerId
    ? plain.messengerId.toString()
    : plain.assignedTo
    ? plain.assignedTo.toString()
    : null;
  const items = Array.isArray(plain.items)
    ? plain.items.map((item) => ({
        id: item?._id ? item._id.toString() : null,
        assetCode: item?.assetCode,
        assetType: item?.assetType,
        expectedAmount: item?.expectedAmount ?? null,
        receivedAmount: item?.receivedAmount ?? null,
        pendingAmount: item?.pendingAmount ?? null,
        metadata: item?.metadata || null,
        currency: (item?.assetCode || 'ARS').toUpperCase(),
      }))
    : [];
  const currencyTotals = buildReceptionCurrencyTotals(items);

  return {
    id: plain._id ? plain._id.toString() : null,
    receptionCode: plain.orderNumber || null,
    orderId: plain._id ? plain._id.toString() : null,
    orderNumber: plain.orderNumber,
    orderType: plain.type,
    completedAt,
    courierId,
    courierName: plain.messenger || null,
    courierPhone: plain.messengerPhone || null,
    courier: {
      id: courierId,
      name: plain.messenger || null,
    },
    origin: plain.origin || null,
    destination: plain.destination || null,
    originLabel: plain.origin || null,
    destinationLabel: plain.destination || null,
    originContact: plain.clientSnapshot
      ? {
          id:
            plain.clientSnapshot.id ||
            (plain.clientSnapshot._id ? plain.clientSnapshot._id.toString() : null),
          fullName: plain.clientSnapshot.fullName || plain.contactName || null,
          shortName: plain.clientSnapshot.shortName || null,
          contactType: plain.clientSnapshot.contactType || null,
          status: plain.clientSnapshot.status || null,
          email: plain.clientSnapshot.email || null,
        }
      : null,
    destinationContact: plain.contactName
      ? {
          id: null,
          fullName: plain.contactName,
          shortName: null,
          contactType: null,
          status: null,
          email: null,
          phone: plain.contactPhone || null,
        }
      : null,
    operationId: plain.operationId ? plain.operationId.toString() : null,
    operationCode: plain.operationCode || null,
    items,
    currencyTotals,
    totalsByCurrency: totals.totalsByCurrency,
    totalAmount: totals.totalAmount,
    receptionStatus: plain.treasuryReceptionStatus || null,
    accountingStatus: plain.treasuryReceptionStatus || null,
    closedWithoutAccountingImpact: Boolean(
      plain.treasuryReception?.closedWithoutAccountingImpact
    ),
    evidences: Array.isArray(plain.evidences) ? plain.evidences : [],
    events: formatReceptionEvents(plain.treasuryReception?.events || []),
    createdAt,
    updatedAt,
  };
};

const pushReceptionEvent = (order, eventPayload = {}) => {
  order.treasuryReception = order.treasuryReception || {};
  if (!Array.isArray(order.treasuryReception.events)) {
    order.treasuryReception.events = [];
  }
  order.treasuryReception.events.push({
    type: eventPayload.type,
    user: eventPayload.userId ? toObjectId(eventPayload.userId) : null,
    userName: eventPayload.userName || null,
    reason: eventPayload.reason || null,
    notes: eventPayload.notes || null,
    ip: eventPayload.ip || null,
    userAgent: eventPayload.userAgent || null,
    totalsByCurrency: Array.isArray(eventPayload.totalsByCurrency)
      ? eventPayload.totalsByCurrency.map((entry) => ({
          currency: (entry?.currency || '').toUpperCase(),
          amount: roundAmount(entry?.amount || 0),
        }))
      : [],
    createdAt: new Date(),
  });
};

const getDestinationBalanceKey = (order, currency, mediumOverride = null) => {
  const normalizedCurrency = String(currency || 'ARS').toUpperCase();
  if (normalizedCurrency === 'USD') {
    return 'usd';
  }
  if (mediumOverride === 'cash' || mediumOverride === 'transfer' || mediumOverride === 'transfers') {
    return mediumOverride === 'transfer' ? 'transfers' : mediumOverride;
  }
  const operationType = String(order?.operationType || '').toLowerCase();
  if (normalizedCurrency === 'ARS') {
    return operationType === 'buy' ? 'transfers' : 'cash';
  }
  return 'cash';
};

const emitBalanceDelta = ({ key, currency, delta, orderId, status, userId }) => {
  emitBalanceUpdated({
    source: 'treasury_reception',
    balanceKey: key,
    currency,
    delta,
    orderId,
    receptionStatus: status,
    emittedBy: userId || null,
  });
};

const applyReceptionBalances = async (order, totals, context = {}, { reverse = false, mediumByCurrency = {} } = {}) => {
  for (const entry of totals.totalsByCurrency) {
    const currency = (entry.currency || 'ARS').toUpperCase();
    const amount = roundAmount(entry.amount || 0);
    if (!amount) {
      continue;
    }
    const destinationKey = getDestinationBalanceKey(order, currency, mediumByCurrency?.[currency]);
    const transitDelta = reverse ? amount : -amount;
    const destinationDelta = reverse ? -amount : amount;

    await adjustTreasuryBalanceForMovement('courier_in_transit', currency, transitDelta, {
      userId: context.userId,
    });
    emitBalanceDelta({
      key: 'courier_in_transit',
      currency,
      delta: transitDelta,
      orderId: order._id,
      status: order.treasuryReceptionStatus,
      userId: context.userId,
    });

    await adjustTreasuryBalanceForMovement(destinationKey, currency, destinationDelta, {
      userId: context.userId,
    });
    emitBalanceDelta({
      key: destinationKey,
      currency,
      delta: destinationDelta,
      orderId: order._id,
      status: order.treasuryReceptionStatus,
      userId: context.userId,
    });
  }
};

const sanitizePositiveNumber = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return numeric;
};

const buildReceptionQuery = (filters = {}) => {
  const match = {
    status: { $in: LOGISTICS_COMPLETED_STATUSES },
  };

  if (filters.status && RECEPTION_STATUS_VALUES.includes(filters.status)) {
    match.treasuryReceptionStatus = filters.status;
  } else {
    match.treasuryReceptionStatus = { $ne: null };
  }

  if (filters.dateFrom || filters.dateTo) {
    match.completedAt = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        match.completedAt.$gte = from;
      }
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        match.completedAt.$lte = to;
      }
    }
    if (Object.keys(match.completedAt).length === 0) {
      delete match.completedAt;
    }
  }

  if (filters.courierId && mongoose.Types.ObjectId.isValid(filters.courierId)) {
    match.assignedTo = new mongoose.Types.ObjectId(filters.courierId);
  } else if (filters.courier) {
    match.messenger = new RegExp(filters.courier, 'i');
  }

  if (filters.contactId) {
    match['clientSnapshot.id'] = filters.contactId;
  }

  const orConditions = [];
  if (filters.contact) {
    const regex = new RegExp(filters.contact, 'i');
    orConditions.push({ contactName: regex }, { 'clientSnapshot.fullName': regex });
  }

  if (filters.operationId && mongoose.Types.ObjectId.isValid(filters.operationId)) {
    match.operationId = new mongoose.Types.ObjectId(filters.operationId);
  }

  if (filters.currency) {
    match['items.assetCode'] = String(filters.currency).toUpperCase();
  }

  if (filters.search) {
    const regex = new RegExp(filters.search, 'i');
    orConditions.push({ orderNumber: regex }, { contactName: regex }, { origin: regex }, { destination: regex });
  }

  if (orConditions.length) {
    match.$or = orConditions;
  }

  return match;
};

const applyAmountFilters = (decoratedOrders, filters = {}) => {
  const parseAmount = (value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const min = parseAmount(filters.amountMin);
  const max = parseAmount(filters.amountMax);
  const currency = filters.currency ? String(filters.currency).toUpperCase() : null;
  if (min === null && max === null) {
    return decoratedOrders;
  }

  return decoratedOrders.filter(({ totals }) => {
    const relevantTotals = currency
      ? totals.totalsByCurrency.filter((entry) => entry.currency === currency)
      : totals.totalsByCurrency;
    const amount = relevantTotals.reduce((acc, entry) => acc + (entry.amount || 0), 0);
    if (min !== null && amount < min) {
      return false;
    }
    if (max !== null && amount > max) {
      return false;
    }
    return true;
  });
};

const listTreasuryReceptions = async (options = {}) => {
  const page = sanitizePositiveNumber(options.page, 1);
  const limit = Math.min(sanitizePositiveNumber(options.limit, DEFAULT_RECEPTIONS_LIMIT), 100);
  const match = buildReceptionQuery(options);
  const orders = await LogisticsOrder.find(match)
    .sort({ completedAt: -1, createdAt: -1 })
    .lean();

  const decorated = orders.map((order) => ({ order, totals: computeReceptionTotals(order) }));
  const filtered = applyAmountFilters(decorated, options);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit).map((entry) =>
    formatReception(entry.order, entry.totals)
  );

  return {
    items: pageItems,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    filters: {
      status: options.status || null,
      dateFrom: options.dateFrom || null,
      dateTo: options.dateTo || null,
      courier: options.courier || options.courierId || null,
      contact: options.contact || options.contactId || null,
      operationId: options.operationId || null,
      amountMin: options.amountMin || null,
      amountMax: options.amountMax || null,
      currency: options.currency || null,
      search: options.search || null,
    },
  };
};

const loadReceptionOrder = async (receptionId) => {
  if (!mongoose.Types.ObjectId.isValid(receptionId)) {
    throw new AppError('Orden logística no encontrada.', 404);
  }
  const order = await LogisticsOrder.findById(receptionId);
  if (!order) {
    throw new AppError('Orden logística no encontrada.', 404);
  }
  return order;
};

const confirmTreasuryReception = async (receptionId, payload = {}, context = {}) => {
  const userId = ensureActionUser(context);
  const order = await loadReceptionOrder(receptionId);

  if (order.treasuryReceptionStatus !== 'pending') {
    throw new AppError('La recepción ya fue gestionada.', 409);
  }

  const totals = computeReceptionTotals(order);
  if (!totals.totalAmount) {
    throw new AppError('No hay valores para impactar en Tesorería.', 422);
  }

  await applyReceptionBalances(order, totals, { userId }, { reverse: false });

  order.treasuryReceptionStatus = 'confirmed';
  order.treasuryReception = order.treasuryReception || {};
  order.treasuryReception.closedWithoutAccountingImpact = false;
  pushReceptionEvent(order, {
    type: 'recepcion.confirmada',
    userId,
    userName: context.userName,
    notes: payload.notes || null,
    ip: context.ip,
    userAgent: context.userAgent,
    totalsByCurrency: totals.totalsByCurrency,
  });
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || null;

  await order.save();

  return formatReception(order, totals);
};

const omitTreasuryReception = async (receptionId, payload = {}, context = {}) => {
  const userId = ensureActionUser(context);
  const reason = String(payload.reason || '').trim();
  if (!reason) {
    throw new AppError('Indicá el motivo de la omisión.', 422);
  }

  const order = await loadReceptionOrder(receptionId);
  if (order.treasuryReceptionStatus !== 'pending') {
    throw new AppError('La recepción ya fue gestionada.', 409);
  }

  const totals = computeReceptionTotals(order);
  await releaseCourierTransitBalance(order, totals, { userId });

  order.treasuryReceptionStatus = 'omitted';
  order.treasuryReception = order.treasuryReception || {};
  order.treasuryReception.closedWithoutAccountingImpact = true;
  pushReceptionEvent(order, {
    type: 'recepcion.omitida',
    userId,
    userName: context.userName,
    reason,
    notes: payload.notes || null,
    ip: context.ip,
    userAgent: context.userAgent,
    totalsByCurrency: totals.totalsByCurrency,
  });
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || null;

  await order.save();

  return formatReception(order, totals);
};

const revertTreasuryReception = async (receptionId, payload = {}, context = {}) => {
  const userId = ensureActionUser(context);
  const order = await loadReceptionOrder(receptionId);

  if (!['confirmed', 'omitted'].includes(order.treasuryReceptionStatus)) {
    throw new AppError('Sólo podés revertir recepciones confirmadas u omitidas.', 409);
  }

  const totals = computeReceptionTotals(order);
  if (order.treasuryReceptionStatus === 'confirmed' && totals.totalAmount) {
    await applyReceptionBalances(order, totals, { userId }, { reverse: true });
  } else if (order.treasuryReceptionStatus === 'omitted') {
    await reserveCourierTransitBalance(order, totals, { userId });
  }

  order.treasuryReceptionStatus = 'pending';
  order.treasuryReception = order.treasuryReception || {};
  order.treasuryReception.closedWithoutAccountingImpact = false;
  pushReceptionEvent(order, {
    type: 'recepcion.revertida',
    userId,
    userName: context.userName,
    reason: String(payload.reason || '').trim() || null,
    notes: payload.notes || null,
    ip: context.ip,
    userAgent: context.userAgent,
    totalsByCurrency: totals.totalsByCurrency,
  });
  order.updatedBy = toObjectId(userId);
  order.updatedByName = context.userName || null;

  await order.save();

  return formatReception(order, totals);
};

const getTreasuryBalances = async () => {
  await Promise.all([
    ensureBalance('transfers', 'ARS'),
    ensureBalance('cash', 'ARS'),
    ensureBalance('usd', 'USD'),
  ]);

  const balances = await TreasuryBalance.find({})
    .sort({ key: 1 })
    .lean();

  return balances.map(formatBalance).filter(Boolean);
};

const generateTreasuryMovementCode = async () => {
  const prefix = 'TRS-';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await TreasuryMovement.exists({ movementCode: code });
    if (!exists) {
      return code;
    }
  }
  return `${prefix}${Date.now()}`;
};

const buildAuditEntry = (action, userId, metadata = {}) => ({
  action,
  user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
  timestamp: new Date(),
  metadata,
});

const formatContact = (contact) => {
  if (!contact) {
    return null;
  }

  const id =
    contact._id && typeof contact._id === 'object' && contact._id.toString
      ? contact._id.toString()
      : contact._id || contact.id;

  return {
    id,
    fullName: contact.fullName || contact.shortName || contact.displayName || '',
    shortName: contact.shortName || contact.fullName || '',
    contactType: contact.contactType || 'client',
    status: contact.status || 'active',
  };
};

const formatMovementOperation = (operation) => ({
  id: operation.id ? operation.id.toString() : null,
  model: operation.model || null,
  code: operation.code || null,
  type: operation.type || null,
  currency: operation.currency || null,
  amount: roundAmount(operation.amount || 0),
  matchedAt: operation.matchedAt ? new Date(operation.matchedAt).toISOString() : null,
  matchedBy: operation.matchedBy ? operation.matchedBy.toString() : null,
});

const formatTreasuryMovement = (movement, contacts = []) => {
  if (!movement) {
    return null;
  }

  const contactMap = new Map(
    contacts.map((contact) => [contact._id ? contact._id.toString() : contact.id, contact])
  );

  const contact =
    movement.contact && contactMap.has(movement.contact.toString())
      ? formatContact(contactMap.get(movement.contact.toString()))
      : movement.contact
      ? { id: movement.contact.toString() }
      : null;

  return {
    id: movement._id ? movement._id.toString() : null,
    movementCode: movement.movementCode,
    type: movement.type,
    medium: movement.medium,
    currency: movement.currency,
    amount: roundAmount(movement.amount),
    balanceKey: movement.balanceKey,
    status: movement.status,
    movementAt: movement.movementAt ? new Date(movement.movementAt).toISOString() : null,
    contact,
    description: movement.description || null,
    reference: movement.reference || null,
    source: movement.source || 'manual',
    linkedOperations: Array.isArray(movement.linkedOperations)
      ? movement.linkedOperations.map(formatMovementOperation)
      : [],
    metadata: movement.metadata || {},
    createdAt: movement.createdAt ? new Date(movement.createdAt).toISOString() : null,
    updatedAt: movement.updatedAt ? new Date(movement.updatedAt).toISOString() : null,
    compensatedAt: movement.compensatedAt
      ? new Date(movement.compensatedAt).toISOString()
      : null,
    compensatedBy: movement.compensatedBy ? movement.compensatedBy.toString() : null,
    cancelledAt: movement.cancelledAt ? new Date(movement.cancelledAt).toISOString() : null,
    cancelledBy: movement.cancelledBy ? movement.cancelledBy.toString() : null,
    cancellationReason: movement.cancellationReason || null,
    auditTrail: Array.isArray(movement.auditTrail)
      ? movement.auditTrail.map((entry) => ({
          action: entry.action,
          user: entry.user ? entry.user.toString() : null,
          timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
          metadata: entry.metadata || {},
        }))
      : [],
  };
};

const deriveTransactionAmountForCurrency = (transaction, currency) => {
  if (!transaction || !currency) {
    return null;
  }
  const normalizedCurrency = currency.toUpperCase();
  const candidates = [
    { asset: transaction.incomingAsset, amount: transaction.incomingAmount },
    { asset: transaction.outgoingAsset, amount: transaction.outgoingAmount },
  ];

  for (const candidate of candidates) {
    if (
      candidate.asset &&
      candidate.asset.code &&
      candidate.asset.code.toUpperCase() === normalizedCurrency
    ) {
      return Number(candidate.amount);
    }
  }

  return null;
};

const getApplyTreasurySettlement = () => {
  // Lazy-load to avoid circular dependency resolution issues
  const service = require('./currentAccount.service');
  if (!service || typeof service.applyTreasurySettlement !== 'function') {
    throw new Error('applyTreasurySettlement is not available');
  }
  return service.applyTreasurySettlement;
};

const getCurrentAccountService = () => {
  // Lazy-load to avoid circular dependency resolution issues
  const service = require('./currentAccount.service');
  if (!service || typeof service.adjustAccountBalance !== 'function') {
    throw new Error('currentAccount.service is not available');
  }
  return service;
};

const fetchOperationLink = async (operationPayload, { session } = {}) => {
  if (!operationPayload) {
    return null;
  }

  const typeInput =
    operationPayload.type ||
    operationPayload.operationType ||
    operationPayload.model ||
    operationPayload.source;

  const normalizedType = (() => {
    if (typeof typeInput !== 'string') {
      return 'Transaction';
    }
    const lowered = typeInput.toLowerCase();
    if (lowered.includes('currentaccount') || lowered.includes('current_account')) {
      return 'CurrentAccountMovement';
    }
    if (lowered.includes('transfer')) {
      return 'TransferOperation';
    }
    return 'Transaction';
  })();

  const id =
    operationPayload.id || operationPayload.operationId || operationPayload.referenceId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('La operación asociada no es válida.', 400);
  }

  let Model = Transaction;
  if (normalizedType === 'TransferOperation') {
    Model = TransferOperation;
  } else if (normalizedType === 'CurrentAccountMovement') {
    Model = CurrentAccountMovement;
  }
  const document = await Model.findById(id).session(session || null);
  if (!document) {
    throw new AppError('La operación asociada no existe.', 404);
  }

  return {
    model: normalizedType,
    document,
  };
};

const validateAndNormalizeMovementPayload = async (payload = {}, { session } = {}) => {
  const type = MOVEMENT_TYPES.includes(payload.type) ? payload.type : 'incoming';
  const medium =
    typeof payload.medium === 'string' && MOVEMENT_MEDIUMS.includes(payload.medium.toLowerCase())
      ? payload.medium.toLowerCase()
      : null;

  if (!medium) {
    throw new AppError('Seleccioná un medio válido (efectivo, transferencia o depósito).', 400);
  }

  const currency =
    typeof payload.currency === 'string' && SUPPORTED_CURRENCIES.includes(payload.currency.toUpperCase())
      ? payload.currency.toUpperCase()
      : null;
  if (!currency) {
    throw new AppError('Seleccioná una moneda válida (ARS o USD).', 400);
  }

  const amount = roundAmount(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Ingresá un monto válido mayor a cero.', 400);
  }

  const movementAtInput = payload.movementAt || payload.date || payload.datetime;
  const movementAt = movementAtInput ? new Date(movementAtInput) : new Date();
  if (Number.isNaN(movementAt.getTime())) {
    throw new AppError('La fecha/hora del movimiento es inválida.', 400);
  }

  const contactIdCandidate =
    payload.contactId || payload.contact || payload.contact?.id || payload.contact?.value || null;
  let contactDoc = null;

  if (contactIdCandidate) {
    if (!mongoose.Types.ObjectId.isValid(contactIdCandidate)) {
      throw new AppError('El contacto asociado no es válido.', 400);
    }
    contactDoc = await Client.findById(contactIdCandidate).session(session || null);
    if (!contactDoc) {
      throw new AppError('El contacto asociado no existe o no está disponible.', 404);
    }
  }

  const operationLink = await fetchOperationLink(payload.operation || payload.operationReference, {
    session,
  });

  if (!contactDoc && operationLink && operationLink.model === 'Transaction') {
    const candidate = operationLink.document.client;
    if (candidate && mongoose.Types.ObjectId.isValid(candidate)) {
      contactDoc = await Client.findById(candidate).session(session || null);
    }
  }

  const reference =
    typeof payload.reference === 'string' && payload.reference.trim().length
      ? payload.reference.trim()
      : null;

  const description =
    typeof payload.description === 'string' && payload.description.trim().length
      ? payload.description.trim()
      : null;

  const metadata =
    payload.metadata && typeof payload.metadata === 'object' ? { ...payload.metadata } : {};

  return {
    type,
    medium,
    currency,
    amount,
    movementAt,
    contactDoc,
    operationLink,
    reference,
    description,
    metadata,
  };
};

const reverseTreasurySettlementForMovement = async (movement, { session, userId } = {}) => {
  if (!movement) {
    return;
  }

  const { ACCOUNT_KEY, adjustAccountBalance, adjustContactBalance } = getCurrentAccountService();
  const currency = String(movement.currency || 'ARS').toUpperCase();
  const amount = roundAmount(movement.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const direction = movement.type === 'outgoing' ? 'outgoing' : 'incoming';
  const delta = direction === 'incoming' ? -amount : amount;

  await adjustAccountBalance(ACCOUNT_KEY, currency, -delta, { session, userId });

  if (movement.contact && mongoose.Types.ObjectId.isValid(movement.contact)) {
    await adjustContactBalance(movement.contact, currency, -delta, { session, userId });
  }

  await CurrentAccountMovement.deleteMany({
    'operation.id': movement._id,
    'operation.source': 'treasury',
    stage: 'settlement',
  }).session(session || null);
};

const registerTreasuryMovement = async (payload = {}, context = {}) => {
  const externalSession = context.session || null;
  const session = externalSession || (await mongoose.startSession());
  let movementDocument;
  let contactForResponse = null;
  let operationLinkEntry = null;
  let balanceSnapshot = null;
  const skipBalanceAdjustments = Boolean(context.skipBalanceAdjustments);
  const skipSettlement = Boolean(context.skipSettlement);
  const skipBalanceEvent = Boolean(context.skipBalanceEvent);
  const deferSideEffects = Boolean(context.deferSideEffects || externalSession);

  const runTransaction = async () => {
    const normalized = await validateAndNormalizeMovementPayload(payload, { session });
    const applySettlement = getApplyTreasurySettlement();
    const autoCompensate =
      typeof context.autoCompensate === 'boolean'
        ? context.autoCompensate
        : !normalized.operationLink || normalized.operationLink.model !== 'Transaction';
    const shouldApplySettlement = !skipSettlement && autoCompensate;

    const balanceMovementType = resolveMovementBalanceType(normalized.currency, normalized.medium);
    const movementCode = await generateTreasuryMovementCode();

    const movement = new TreasuryMovement({
      movementCode,
      type: normalized.type,
      medium: normalized.medium,
      currency: normalized.currency,
      amount: normalized.amount,
      movementAt: normalized.movementAt,
      status: 'registered',
      contact: normalized.contactDoc ? normalized.contactDoc._id : null,
      description: normalized.description,
      reference: normalized.reference,
      source: normalized.operationLink ? 'operation' : 'manual',
      balanceKey: normalizeBalanceKey(balanceMovementType),
      metadata: normalized.metadata,
      createdBy:
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null,
      updatedBy:
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null,
      auditTrail: [buildAuditEntry('registered', context.userId, { source: 'api' })],
    });

    if (normalized.operationLink) {
      const { document, model } = normalized.operationLink;
      const operationAmount =
        model === 'Transaction'
          ? deriveTransactionAmountForCurrency(document, normalized.currency) || normalized.amount
          : Number(document.totalAmount || normalized.amount);

      operationLinkEntry = {
        id: document._id,
        model,
        code: document.operationCode || document.movementCode || null,
        type: model === 'Transaction' ? document.type : document.movementType,
        currency: normalized.currency,
        amount: roundAmount(operationAmount || normalized.amount),
        matchedAt: new Date(),
        matchedBy:
          context.userId && mongoose.Types.ObjectId.isValid(context.userId)
            ? context.userId
            : null,
      };

      movement.linkedOperations = [operationLinkEntry];

      if (model === 'TransferOperation') {
        document.status = 'completed';
        document.completedAt = document.completedAt || new Date();
        document.completedBy =
          context.userId && mongoose.Types.ObjectId.isValid(context.userId)
            ? context.userId
            : document.completedBy || null;
        document.updatedBy =
          context.userId && mongoose.Types.ObjectId.isValid(context.userId)
            ? context.userId
            : document.updatedBy || null;
        await document.save({ session });
      }
    }

    await movement.save({ session });

    const delta = movement.type === 'incoming' ? normalized.amount : -normalized.amount;
    if (!skipBalanceAdjustments) {
      balanceSnapshot = await adjustTreasuryBalanceForMovement(
        balanceMovementType,
        normalized.currency,
        delta,
        {
          session,
          userId: context.userId,
        }
      );
    } else {
      balanceSnapshot = await TreasuryBalance.findOne({
        key: normalizeBalanceKey(balanceMovementType),
        currency: normalized.currency,
      })
        .session(session)
        .lean();
    }

    if (shouldApplySettlement) {
      if (normalized.contactDoc) {
        const settlementPayload = {
          _id: movement._id,
          movementType: balanceMovementType,
          direction: movement.type,
          currency: normalized.currency,
          totalAmount: normalized.amount,
          distributionLines: [
            {
              contact: normalized.contactDoc._id,
              amount: normalized.amount,
            },
          ],
          operationCode: movement.movementCode,
        };

        await applySettlement(settlementPayload, {
          session,
          userId: context.userId,
        });

        movement.contact = normalized.contactDoc._id;
        contactForResponse = normalized.contactDoc.toObject();
        movement.metadata = {
          ...(movement.metadata || {}),
          settlementApplied: true,
        };
      } else if (normalized.operationLink && normalized.operationLink.model === 'Transaction') {
        const contactCandidate = normalized.operationLink.document.client;
        if (contactCandidate && mongoose.Types.ObjectId.isValid(contactCandidate)) {
          const contactDoc = await Client.findById(contactCandidate).session(session);
          if (contactDoc) {
            // Map transaction type to treasury direction: buy -> incoming (ARS ingresa), sell -> outgoing (ARS egresa)
            const transactionType = normalized.operationLink.document.type;
            const treasuryDirection = transactionType === 'buy' ? 'incoming' : 'outgoing';

            const settlementPayload = {
              _id: movement._id,
              movementType: balanceMovementType,
              direction: treasuryDirection,
              currency: normalized.currency,
              totalAmount: normalized.amount,
              distributionLines: [
                {
                  contact: contactDoc._id,
                  amount: normalized.amount,
                },
              ],
              operationCode: movement.movementCode,
            };

            await applySettlement(settlementPayload, {
              session,
              userId: context.userId,
            });

            movement.contact = contactDoc._id;
            contactForResponse = contactDoc.toObject();
            movement.metadata = {
              ...(movement.metadata || {}),
              settlementApplied: true,
            };

            await recordTransactionSettlement(
              normalized.operationLink.document._id,
              {
                movementId: movement._id,
                amount: normalized.amount,
                currency: normalized.currency,
                direction: treasuryDirection,
                movementType: balanceMovementType,
                source: 'treasury_movement',
              },
              { session, userId: context.userId }
            );
          }
        }
      }
    }

    if (autoCompensate && movement.linkedOperations && movement.linkedOperations.length > 0) {
      movement.status = 'compensated';
      movement.compensatedAt = new Date();
      movement.compensatedBy =
        context.userId && mongoose.Types.ObjectId.isValid(context.userId)
          ? context.userId
          : null;
      movement.auditTrail.push(
        buildAuditEntry('compensated', context.userId, { method: 'auto-link' })
      );
    }

    movement.updatedBy =
      context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;
    await movement.save({ session });

    movementDocument = movement.toObject();
    if (!contactForResponse && normalized.contactDoc) {
      contactForResponse = normalized.contactDoc.toObject();
    }
  };

try {
  if (externalSession) {
    await runTransaction();
  } else {
    await session.withTransaction(runTransaction);
  }
} finally {
  if (!externalSession) {
    session.endSession();
  }
}

const formattedMovement = formatTreasuryMovement(movementDocument, contactForResponse ? [contactForResponse] : []);

const movementDelta =
  movementDocument?.type === 'incoming'
    ? roundAmount(movementDocument.amount || 0)
    : -roundAmount(movementDocument?.amount || 0);

const sideEffects = {
  movement: formattedMovement,
  balanceSnapshot,
  movementDelta,
  userId: context.userId || null,
  skipBalanceEvent,
  };

  if (!deferSideEffects) {
    emitTreasuryMovementSideEffects(sideEffects);
  }

  return {
    movement: formattedMovement,
    balance: balanceSnapshot ? formatBalance(balanceSnapshot) : null,
    sideEffects: deferSideEffects ? sideEffects : null,
  };
};

const updateTreasuryMovement = async (movementId, payload = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(movementId)) {
    throw new AppError('El identificador de movimiento es inv lido.', 400);
  }

  const session = await mongoose.startSession();
  let updatedDocument;
  let contactForResponse = null;
  let balanceSnapshot = null;
  const balanceChanges = [];
  const hasOperationPayload =
    Object.prototype.hasOwnProperty.call(payload, 'operation') ||
    Object.prototype.hasOwnProperty.call(payload, 'operationReference');
  const hasContactPayload =
    Object.prototype.hasOwnProperty.call(payload, 'contactId') ||
    Object.prototype.hasOwnProperty.call(payload, 'contact');
  const hasReferencePayload = Object.prototype.hasOwnProperty.call(payload, 'reference');
  const hasDescriptionPayload = Object.prototype.hasOwnProperty.call(payload, 'description');
  const hasMetadataPayload = Object.prototype.hasOwnProperty.call(payload, 'metadata');

  try {
    await session.withTransaction(async () => {
      const movement = await TreasuryMovement.findById(movementId).session(session);
      if (!movement) {
        throw new AppError('El movimiento indicado no existe.', 404);
      }

      if (movement.status !== 'registered') {
        throw new AppError('Solo pod‚s editar movimientos pendientes.', 409);
      }

      const mergedPayload = {
        type: payload.type ?? movement.type,
        medium: payload.medium ?? movement.medium,
        currency: payload.currency ?? movement.currency,
        amount: payload.amount ?? movement.amount,
        movementAt: payload.movementAt ?? movement.movementAt,
        contactId: hasContactPayload ? payload.contactId ?? payload.contact : movement.contact?.toString(),
        reference: hasReferencePayload ? payload.reference : movement.reference,
        description: hasDescriptionPayload ? payload.description : movement.description,
        metadata: hasMetadataPayload
          ? { ...(movement.metadata || {}), ...(payload.metadata || {}) }
          : movement.metadata || {},
      };

      if (hasOperationPayload) {
        mergedPayload.operation = payload.operation || payload.operationReference || null;
      }

      const normalized = await validateAndNormalizeMovementPayload(mergedPayload, { session });

      const oldBalanceMovementType = resolveMovementBalanceType(movement.currency, movement.medium);
      const newBalanceMovementType = resolveMovementBalanceType(normalized.currency, normalized.medium);
      const previousSnapshot = {
        type: movement.type,
        medium: movement.medium,
        currency: movement.currency,
        amount: roundAmount(movement.amount || 0),
      };
      const oldDelta =
        movement.type === 'incoming'
          ? roundAmount(movement.amount || 0)
          : -roundAmount(movement.amount || 0);
      const newDelta =
        normalized.type === 'incoming'
          ? roundAmount(normalized.amount || 0)
          : -roundAmount(normalized.amount || 0);

      const hadSettlementApplied = Boolean(movement.metadata?.settlementApplied);
      if (hadSettlementApplied) {
        await reverseTreasurySettlementForMovement(movement, {
          session,
          userId: context.userId,
        });
        movement.metadata = {
          ...(movement.metadata || {}),
          settlementApplied: false,
        };
      }

      if (oldBalanceMovementType === newBalanceMovementType && movement.currency === normalized.currency) {
        const deltaDiff = roundAmount(newDelta - oldDelta);
        if (deltaDiff) {
          balanceSnapshot = await adjustTreasuryBalanceForMovement(
            newBalanceMovementType,
            normalized.currency,
            deltaDiff,
            {
              session,
              userId: context.userId,
            }
          );
          balanceChanges.push({
            balanceKey: normalizeBalanceKey(newBalanceMovementType),
            currency: normalized.currency,
            delta: deltaDiff,
          });
        }
      } else {
        const reverseDelta = roundAmount(-oldDelta);
        if (reverseDelta) {
          await adjustTreasuryBalanceForMovement(oldBalanceMovementType, movement.currency, reverseDelta, {
            session,
            userId: context.userId,
          });
          balanceChanges.push({
            balanceKey: normalizeBalanceKey(oldBalanceMovementType),
            currency: movement.currency,
            delta: reverseDelta,
          });
        }

        if (newDelta) {
          balanceSnapshot = await adjustTreasuryBalanceForMovement(
            newBalanceMovementType,
            normalized.currency,
            newDelta,
            {
              session,
              userId: context.userId,
            }
          );
          balanceChanges.push({
            balanceKey: normalizeBalanceKey(newBalanceMovementType),
            currency: normalized.currency,
            delta: newDelta,
          });
        }
      }

      movement.type = normalized.type;
      movement.medium = normalized.medium;
      movement.currency = normalized.currency;
      movement.amount = normalized.amount;
      movement.movementAt = normalized.movementAt;
      movement.contact = normalized.contactDoc ? normalized.contactDoc._id : null;
      movement.reference = normalized.reference;
      movement.description = normalized.description;
      movement.balanceKey = normalizeBalanceKey(newBalanceMovementType);
      movement.metadata = {
        ...(movement.metadata || {}),
        ...(normalized.metadata || {}),
      };

      if (hasOperationPayload) {
        if (normalized.operationLink) {
          const { document, model } = normalized.operationLink;
          const operationAmount =
            model === 'Transaction'
              ? deriveTransactionAmountForCurrency(document, normalized.currency) || normalized.amount
              : Number(document.totalAmount || normalized.amount);

          movement.linkedOperations = [
            {
              id: document._id,
              model,
              code: document.operationCode || document.movementCode || null,
              type: model === 'Transaction' ? document.type : document.movementType,
              currency: normalized.currency,
              amount: roundAmount(operationAmount || normalized.amount),
              matchedAt: new Date(),
              matchedBy:
                context.userId && mongoose.Types.ObjectId.isValid(context.userId)
                  ? context.userId
                  : null,
            },
          ];
          movement.source = 'operation';
        } else {
          movement.linkedOperations = [];
          movement.source = 'manual';
        }
      } else if (movement.linkedOperations && movement.linkedOperations.length > 0) {
        movement.linkedOperations = movement.linkedOperations.map((entry) => ({
          ...entry,
          currency: normalized.currency,
          amount: roundAmount(normalized.amount || entry.amount || 0),
        }));
      }

      if (hadSettlementApplied && normalized.contactDoc) {
        const applySettlement = getApplyTreasurySettlement();
        await applySettlement(
          {
            _id: movement._id,
            movementType: newBalanceMovementType,
            direction: normalized.type,
            currency: normalized.currency,
            totalAmount: normalized.amount,
            distributionLines: [
              {
                contact: normalized.contactDoc._id,
                amount: normalized.amount,
              },
            ],
            operationCode: movement.movementCode,
          },
          { session, userId: context.userId }
        );

        movement.metadata = {
          ...(movement.metadata || {}),
          settlementApplied: true,
        };
      }

      movement.auditTrail = movement.auditTrail || [];
      movement.auditTrail.push(
        buildAuditEntry('updated', context.userId, {
          previous: previousSnapshot,
          current: {
            type: normalized.type,
            medium: normalized.medium,
            currency: normalized.currency,
            amount: roundAmount(normalized.amount),
          },
        })
      );

      movement.updatedBy =
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;
      await movement.save({ session });

      updatedDocument = movement.toObject();
      if (normalized.contactDoc) {
        contactForResponse = normalized.contactDoc.toObject();
      }

      if (!balanceSnapshot) {
        balanceSnapshot = await TreasuryBalance.findOne({
          key: normalizeBalanceKey(newBalanceMovementType),
          currency: normalized.currency,
        })
          .session(session)
          .lean();
      }
    });
  } finally {
    session.endSession();
  }

  const formattedMovement = formatTreasuryMovement(
    updatedDocument,
    contactForResponse ? [contactForResponse] : []
  );

  balanceChanges.forEach((change) => {
    emitBalanceUpdated({
      source: 'treasury_movement_update',
      movementId: formattedMovement?.id || null,
      movementCode: formattedMovement?.movementCode || null,
      balanceKey: change.balanceKey,
      currency: change.currency,
      delta: change.delta,
      emittedBy: context.userId || null,
    });
  });

  return {
    movement: formattedMovement,
    balance: balanceSnapshot ? formatBalance(balanceSnapshot) : null,
  };
};

const buildMovementQuery = (filters = {}) => {
  const query = {};

  if (filters.type && MOVEMENT_TYPES.includes(filters.type)) {
    query.type = filters.type;
  }

  if (filters.medium && MOVEMENT_MEDIUMS.includes(filters.medium)) {
    query.medium = filters.medium;
  }

  if (filters.currency && SUPPORTED_CURRENCIES.includes(filters.currency.toUpperCase())) {
    query.currency = filters.currency.toUpperCase();
  }

  if (filters.status && ['registered', 'compensated', 'cancelled'].includes(filters.status)) {
    query.status = filters.status;
  }

  if (filters.contact && mongoose.Types.ObjectId.isValid(filters.contact)) {
    query.contact = new mongoose.Types.ObjectId(filters.contact);
  }

  if (filters.dateFrom || filters.dateTo) {
    query.movementAt = {};
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        query.movementAt.$gte = from;
      }
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        query.movementAt.$lte = to;
      }
    }
    if (Object.keys(query.movementAt).length === 0) {
      delete query.movementAt;
    }
  }

  if (filters.search && typeof filters.search === 'string') {
    const cleaned = filters.search.trim().replace(/^#/, '');
    if (cleaned) {
      const regex = new RegExp(escapeRegex(cleaned), 'i');
      const orFilters = [
        { movementCode: regex },
        { reference: regex },
        { description: regex },
        { 'linkedOperations.code': regex },
      ];

      if (mongoose.Types.ObjectId.isValid(cleaned)) {
        const objectId = new mongoose.Types.ObjectId(cleaned);
        orFilters.push({ _id: objectId }, { contact: objectId });
      }

      query.$or = orFilters;
    }
  }

  return query;
};

const listTreasuryMovements = async ({
  page = 1,
  limit = 25,
  sortBy = 'movementAt',
  sortDirection = 'desc',
  filters = {},
} = {}) => {
  const numericPage = Math.max(Number(page) || 1, 1);
  const numericLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  const query = buildMovementQuery(filters);

  const sort = {};
  const allowedSortFields = ['movementAt', 'amount', 'movementCode', 'createdAt'];
  const normalizedSort = allowedSortFields.includes(sortBy) ? sortBy : 'movementAt';
  sort[normalizedSort] = sortDirection === 'asc' ? 1 : -1;

  // Single aggregation call with $facet to fetch paginated items, totals and count in one roundtrip
  const [aggregated] = await TreasuryMovement.aggregate([
    { $match: query },
    {
      $facet: {
        metadata: [{ $count: 'totalItems' }],
        totals: [
          {
            $group: {
              _id: { currency: '$currency', type: '$type' },
              amount: { $sum: '$amount' },
            },
          },
        ],
        items: [
          { $sort: sort },
          { $skip: (numericPage - 1) * numericLimit },
          { $limit: numericLimit },
        ],
      },
    },
    {
      $project: {
        totalItems: { $ifNull: [{ $arrayElemAt: ['$metadata.totalItems', 0] }, 0] },
        totals: 1,
        items: 1,
      },
    },
  ]).exec();

  const totalItems = aggregated ? aggregated.totalItems : 0;
  const movements = aggregated ? aggregated.items : [];
  const totals = aggregated ? aggregated.totals : [];

  const contactIds = movements
    .map((movement) => movement.contact)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1 })
        .lean()
    : [];

  const items = movements.map((movement) => formatTreasuryMovement(movement, contacts));

  const totalsByCurrency = totals.reduce((acc, total) => {
    const currency = total._id.currency;
    const type = total._id.type;
    const amount = roundAmount(total.amount);
    if (!acc[currency]) {
      acc[currency] = { incoming: 0, outgoing: 0, net: 0 };
    }
    if (type === 'incoming') {
      acc[currency].incoming = roundAmount((acc[currency].incoming || 0) + amount);
      acc[currency].net = roundAmount((acc[currency].net || 0) + amount);
    } else {
      acc[currency].outgoing = roundAmount((acc[currency].outgoing || 0) + amount);
      acc[currency].net = roundAmount((acc[currency].net || 0) - amount);
    }
    return acc;
  }, {});

  return {
    pagination: {
      page: numericPage,
      limit: numericLimit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / numericLimit)),
    },
    totals: totalsByCurrency,
    items,
  };
};

const getTreasuryMovementById = async (idOrCode) => {
  if (!idOrCode) {
    throw new AppError('Debés indicar el movimiento a consultar.', 400);
  }

  let movement = null;
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    movement = await TreasuryMovement.findById(idOrCode).lean();
  }

  if (!movement) {
    movement = await TreasuryMovement.findOne({ movementCode: idOrCode }).lean();
  }

  if (!movement) {
    throw new AppError('El movimiento solicitado no existe.', 404);
  }

  const contacts = movement.contact
    ? await Client.find({ _id: movement.contact })
        .select({ fullName: 1, shortName: 1, contactType: 1, status: 1 })
        .lean()
    : [];

  return formatTreasuryMovement(movement, contacts);
};

const compensateTreasuryMovement = async (movementId, payload = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(movementId)) {
    throw new AppError('El identificador de movimiento es inválido.', 400);
  }

  const session = await mongoose.startSession();
  let updatedDocument;
  let contactForResponse = null;

  try {
    await session.withTransaction(async () => {
      const applySettlement = getApplyTreasurySettlement();
      const movement = await TreasuryMovement.findById(movementId).session(session);
      if (!movement) {
        throw new AppError('El movimiento indicado no existe.', 404);
      }

      if (movement.status === 'cancelled') {
        throw new AppError('No podés compensar un movimiento anulado.', 409);
      }

      if (movement.status === 'compensated' && !payload.force) {
        throw new AppError('El movimiento ya está compensado.', 409);
      }

      const amount = payload.amount ? roundAmount(payload.amount) : roundAmount(movement.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('El monto a compensar es inválido.', 400);
      }

      if (amount > roundAmount(movement.amount) && !payload.allowOverpay) {
        throw new AppError('El monto a compensar supera el movimiento original.', 400);
      }

      const balanceMovementType = resolveMovementBalanceType(movement.currency, movement.medium);

      let contactDoc = null;
      if (movement.contact) {
        contactDoc = await Client.findById(movement.contact).session(session);
      }

      if (!contactDoc && payload.contactId) {
        if (!mongoose.Types.ObjectId.isValid(payload.contactId)) {
          throw new AppError('El contacto indicado no es válido.', 400);
        }
        contactDoc = await Client.findById(payload.contactId).session(session);
        if (!contactDoc) {
          throw new AppError('El contacto indicado no existe.', 404);
        }
        movement.contact = contactDoc._id;
      }

      if (!movement.metadata || typeof movement.metadata !== 'object') {
        movement.metadata = {};
      }

      if (!movement.metadata.settlementApplied && contactDoc) {
        const settlementPayload = {
          _id: movement._id,
          movementType: balanceMovementType,
          direction: movement.type,
          currency: movement.currency,
          totalAmount: amount,
          distributionLines: [
            {
              contact: contactDoc._id,
              amount,
            },
          ],
          operationCode: movement.movementCode,
        };

        await applySettlement(settlementPayload, {
          session,
          userId: context.userId,
        });

        movement.metadata.settlementApplied = true;
      }

      if (payload.operation || payload.operationReference) {
        movement.linkedOperations = movement.linkedOperations || [];
        const operationLink = await fetchOperationLink(
          payload.operation || payload.operationReference,
          { session }
        );

        const existing = movement.linkedOperations.find((op) =>
          op.id && operationLink && String(op.id) === String(operationLink.document._id)
        );

        if (!existing) {
          let operationAmount = amount;
          let operationCode = null;
          let operationType = null;

          if (operationLink.model === 'Transaction') {
            operationAmount =
              deriveTransactionAmountForCurrency(operationLink.document, movement.currency) ||
              amount;
            operationCode = operationLink.document.operationCode || null;
            operationType = operationLink.document.type || null;
          } else if (operationLink.model === 'TransferOperation') {
            operationAmount = Number(operationLink.document.totalAmount || amount);
            operationCode = operationLink.document.operationCode || null;
            operationType = operationLink.document.movementType || null;
          } else if (operationLink.model === 'CurrentAccountMovement') {
            operationAmount = Math.abs(Number(operationLink.document.amount || amount));
            operationCode =
              operationLink.document.operation?.code ||
              operationLink.document.metadata?.operationCode ||
              null;
            operationType =
              operationLink.document.operation?.type ||
              operationLink.document.metadata?.operationType ||
              operationLink.document.accountKey ||
              null;
          }

          movement.linkedOperations.push({
            id: operationLink.document._id,
            model: operationLink.model,
            code: operationCode,
            type: operationType,
            currency: operationLink.document.currency || movement.currency,
            amount: roundAmount(operationAmount || amount),
            matchedAt: new Date(),
            matchedBy:
              context.userId && mongoose.Types.ObjectId.isValid(context.userId)
                ? context.userId
                : null,
          });
        }

        if (operationLink.model === 'Transaction') {
          const transactionDirection =
            operationLink.document.type === 'buy' ? 'outgoing' : 'incoming';
          await recordTransactionSettlement(
            operationLink.document._id,
            {
              movementId: movement._id,
              amount,
              currency: movement.currency,
              direction: transactionDirection,
              movementType: balanceMovementType,
              source: payload.operation ? 'treasury_compensation' : 'treasury_movements',
            },
            { session, userId: context.userId }
          );
        }

        if (operationLink.model === 'TransferOperation') {
          operationLink.document.status = 'completed';
          operationLink.document.completedAt =
            operationLink.document.completedAt || new Date();
          operationLink.document.completedBy =
            context.userId && mongoose.Types.ObjectId.isValid(context.userId)
              ? context.userId
              : operationLink.document.completedBy || null;
          operationLink.document.updatedBy =
            context.userId && mongoose.Types.ObjectId.isValid(context.userId)
              ? context.userId
              : operationLink.document.updatedBy || null;
          await operationLink.document.save({ session });
        }

        if (operationLink.model === 'CurrentAccountMovement') {
          const contactId = operationLink.document.contact;
          if (!movement.contact && contactId && mongoose.Types.ObjectId.isValid(contactId)) {
            const contactFromLedger = await Client.findById(contactId).session(session);
            if (contactFromLedger) {
              movement.contact = contactFromLedger._id;
              contactDoc = contactFromLedger;
            }
          }

          if (!movement.metadata.settlementApplied && contactDoc) {
            const settlementPayload = {
              _id: movement._id,
              movementType: balanceMovementType,
              direction: movement.type,
              currency: movement.currency,
              totalAmount: amount,
              distributionLines: [
                {
                  contact: contactDoc._id,
                  amount,
                },
              ],
              operationCode: movement.movementCode,
            };

            await applySettlement(settlementPayload, {
              session,
              userId: context.userId,
            });

            movement.metadata.settlementApplied = true;
          }
        }
      }

      movement.status = 'compensated';
      movement.compensatedAt = new Date();
      movement.compensatedBy =
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;

      movement.auditTrail = movement.auditTrail || [];
      movement.auditTrail.push(
        buildAuditEntry('compensated', context.userId, {
          method: payload.operation ? 'operation-link' : 'manual',
        })
      );

      movement.updatedBy =
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;
      await movement.save({ session });

      updatedDocument = movement.toObject();
      if (contactDoc) {
        contactForResponse = contactDoc.toObject();
      }
    });
  } finally {
    session.endSession();
  }

  const formattedMovement = formatTreasuryMovement(
    updatedDocument,
    contactForResponse ? [contactForResponse] : []
  );

  emitTreasuryMovementNotification(formattedMovement, {
    event: 'compensated',
    userId: context.userId || null,
  });

  return formattedMovement;
};

const cancelTreasuryMovement = async (movementId, { reason } = {}, context = {}) => {
  if (!mongoose.Types.ObjectId.isValid(movementId)) {
    throw new AppError('El identificador de movimiento es inválido.', 400);
  }

  const session = await mongoose.startSession();
  let updatedDocument;
  let contactForResponse = null;
  let balanceSnapshot = null;
  let cancellationReason = null;

  try {
    await session.withTransaction(async () => {
      const applySettlement = getApplyTreasurySettlement();
      const movement = await TreasuryMovement.findById(movementId).session(session);
      if (!movement) {
        throw new AppError('El movimiento indicado no existe.', 404);
      }

      if (movement.status === 'cancelled') {
        throw new AppError('El movimiento ya se encuentra anulado.', 409);
      }

      if (movement.status === 'compensated') {
        throw new AppError('No podés anular un movimiento compensado.', 409);
      }

      const balanceMovementType = resolveMovementBalanceType(movement.currency, movement.medium);
      const delta = movement.type === 'incoming' ? movement.amount : -movement.amount;

      balanceSnapshot = await adjustTreasuryBalanceForMovement(
        balanceMovementType,
        movement.currency,
        -delta,
        {
          session,
          userId: context.userId,
        }
      );

      if (movement.metadata?.settlementApplied && movement.contact) {
        const contactDoc = await Client.findById(movement.contact).session(session);
        if (contactDoc) {
          const oppositeDirection = movement.type === 'incoming' ? 'outgoing' : 'incoming';
          const settlementPayload = {
            _id: movement._id,
            movementType: balanceMovementType,
            direction: oppositeDirection,
            currency: movement.currency,
            totalAmount: movement.amount,
            distributionLines: [
              {
                contact: contactDoc._id,
                amount: movement.amount,
              },
            ],
            operationCode: movement.movementCode,
          };

          await applySettlement(settlementPayload, {
            session,
            userId: context.userId,
          });
          contactForResponse = contactDoc.toObject();
        }
      }

      movement.status = 'cancelled';
      movement.cancelledAt = new Date();
      movement.cancelledBy =
        context.userId && mongoose.Types.ObjectId.isValid(context.userId) ? context.userId : null;
      cancellationReason =
        typeof reason === 'string' && reason.trim().length ? reason.trim() : null;
      movement.cancellationReason = cancellationReason;

      movement.auditTrail = movement.auditTrail || [];
      movement.auditTrail.push(
        buildAuditEntry('cancelled', context.userId, {
          reason: movement.cancellationReason,
        })
      );

      movement.metadata = {
        ...(movement.metadata || {}),
        settlementApplied: false,
        cancelled: true,
      };

      const linkedOperations = Array.isArray(movement.linkedOperations)
        ? movement.linkedOperations
        : [];

      const linkedTransactions = linkedOperations.filter(
        (op) => op && op.model === 'Transaction' && op.id
      );
      if (linkedTransactions.length) {
        await Promise.all(
          linkedTransactions.map((op) =>
            revertTransactionSettlement(op.id, movement._id, {
              session,
              userId: context.userId,
            })
          )
        );
      }

      const linkedTransfers = linkedOperations.filter(
        (op) => op && op.model === 'TransferOperation' && op.id
      );
      if (linkedTransfers.length) {
        await Promise.all(
          linkedTransfers.map(async (op) => {
            const transfer = await TransferOperation.findById(op.id).session(session);
            if (!transfer) {
              return;
            }
            transfer.status = 'cancelled';
            transfer.cancelledAt = new Date();
            transfer.cancelledBy =
              context.userId && mongoose.Types.ObjectId.isValid(context.userId)
                ? context.userId
                : transfer.cancelledBy || null;
            transfer.cancellationReason =
              typeof reason === 'string' && reason.trim().length ? reason.trim() : null;
            transfer.updatedBy =
              context.userId && mongoose.Types.ObjectId.isValid(context.userId)
                ? context.userId
                : transfer.updatedBy || null;
            await transfer.save({ session });
          })
        );
      }

      await movement.save({ session });
      updatedDocument = movement.toObject();
    });
  } finally {
    session.endSession();
  }

  const formattedMovement = formatTreasuryMovement(
    updatedDocument,
    contactForResponse ? [contactForResponse] : []
  );

  const movementDelta =
    formattedMovement?.type === 'incoming'
      ? -roundAmount(formattedMovement.amount || 0)
      : roundAmount(formattedMovement?.amount || 0);

  emitBalanceUpdated({
    source: 'treasury_movement_cancelled',
    movementId: formattedMovement?.id || null,
    movementCode: formattedMovement?.movementCode || null,
    balanceKey: formattedMovement?.balanceKey || null,
    currency: formattedMovement?.currency || null,
    delta: movementDelta,
    emittedBy: context.userId || null,
  });

  emitTreasuryMovementNotification(formattedMovement, {
    event: 'cancelled',
    balanceSnapshot,
    userId: context.userId || null,
    reason: cancellationReason,
  });
  evaluateBalanceAlerts(balanceSnapshot, { performedBy: context.userId });

  return formattedMovement;
};

const suggestCompensationsForMovement = async (movementId, { limit = 10 } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(movementId)) {
    throw new AppError('El identificador de movimiento es inválido.', 400);
  }

  const movement = await TreasuryMovement.findById(movementId).lean();
  if (!movement) {
    throw new AppError('El movimiento indicado no existe.', 404);
  }

  const movementCurrency = normalizeCurrencyCode(movement.currency || 'ARS');
  const currencyCandidates = buildCurrencyCandidates(movementCurrency);
  const query = {
    ledger: 'contact',
    stage: 'registration',
  };
  if (currencyCandidates.length === 1) {
    query.currency = currencyCandidates[0];
  } else if (currencyCandidates.length > 1) {
    query.currency = { $in: currencyCandidates };
  }

  const candidateMovements = await CurrentAccountMovement.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 10, 1), 25))
    .lean();

  if (!candidateMovements.length) {
    return {
      movement: formatTreasuryMovement(movement),
      suggestions: [],
    };
  }

  const transactionIds = candidateMovements
    .map((entry) => (entry.operation?.source === 'transaction' ? entry.operation.id : null))
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const transactions = transactionIds.length
    ? await Transaction.find({ _id: { $in: transactionIds } })
        .select({
          client: 1,
          type: 1,
          operationCode: 1,
          status: 1,
          completedAt: 1,
          incomingAsset: 1,
          outgoingAsset: 1,
        })
        .lean()
    : [];

  const transactionMap = new Map(transactions.map((tx) => [tx._id.toString(), tx]));

  const contactIds = candidateMovements
    .map((entry) => entry.contact)
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1 })
        .lean()
    : [];

  const contactMap = new Map(contacts.map((contact) => [contact._id.toString(), contact]));

  const needsConversion = candidateMovements.some(
    (entry) => normalizeCurrencyCode(entry.currency) !== movementCurrency
  );
  const usdSellRate = needsConversion ? await resolveUsdSellRate() : null;

  const suggestions = candidateMovements
    .map((entry) => {
      const entryCurrency = normalizeCurrencyCode(entry.currency || movementCurrency);
      const convertedAmount = convertAmountToCurrency(
        Number(entry.amount || 0),
        entryCurrency,
        movementCurrency,
        usdSellRate
      );
      if (!Number.isFinite(convertedAmount)) {
        return null;
      }
      const normalizedAmount = roundAmount(convertedAmount);

      const absoluteMovementAmount = Math.abs(Number(movement.amount) || 0);
      const absoluteEntryAmount = Math.abs(normalizedAmount);
      const amountDifference = roundAmount(Math.abs(absoluteMovementAmount - absoluteEntryAmount));
      const ratio =
        absoluteMovementAmount > 0 ? amountDifference / absoluteMovementAmount : amountDifference;

      const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
      const movementDate = movement.movementAt ? new Date(movement.movementAt) : null;
      const daysDifference =
        createdAt && movementDate
          ? Math.round(
              Math.abs(createdAt.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null;

      const transaction = entry.operation?.source === 'transaction'
        ? transactionMap.get(entry.operation.id?.toString())
        : null;

      const contactDoc = entry.contact ? contactMap.get(entry.contact.toString()) : null;

      const score =
        1 /
        (1 +
          amountDifference +
          (movement.contact &&
          entry.contact &&
          movement.contact.toString() === entry.contact.toString()
            ? 0
            : 0.5) +
          (daysDifference || 0) * 0.1);

      const fallbackOperationDescriptor = {
        id: entry._id.toString(),
        model: 'CurrentAccountMovement',
        code: entry.operation?.code || entry.metadata?.operationCode || null,
        movementType: entry.operation?.type || entry.metadata?.operationType || null,
        status: entry.operation?.status || entry.metadata?.status || entry.stage || null,
        confirmedAt: null,
      };

      const operationDescriptor = transaction
        ? {
            id: transaction._id.toString(),
            model: 'Transaction',
            code: transaction.operationCode || null,
            movementType: transaction.type || null,
            status: transaction.status || null,
            confirmedAt: transaction.completedAt ? transaction.completedAt.toISOString() : null,
          }
        : entry.operation?.id && entry.operation?.model
        ? {
            id: entry.operation.id.toString(),
            model: entry.operation.model,
            code: entry.operation.code || null,
            movementType: entry.operation.type || null,
            status: entry.operation.status || null,
            confirmedAt: null,
          }
        : fallbackOperationDescriptor;

      return {
        suggestionId: entry._id.toString(),
        currentAccountMovementId: entry._id.toString(),
        operationId: operationDescriptor.id || null,
        model: operationDescriptor.model || null,
        code: operationDescriptor.code || null,
        amount: normalizedAmount,
        currency: movementCurrency || entry.currency || 'ARS',
        originalAmount: roundAmount(Number(entry.amount || 0)),
        originalCurrency: entryCurrency || movementCurrency || entry.currency || 'ARS',
        conversionRate: entryCurrency !== movementCurrency ? usdSellRate : null,
        contactName: contactDoc ? contactDoc.fullName || contactDoc.shortName || null : null,
        movementType: operationDescriptor.movementType || null,
        status: operationDescriptor.status || null,
        confirmedAt: operationDescriptor.confirmedAt || null,
        match: {
          amountDifference,
          ratio: Number(ratio.toFixed(4)),
          daysDifference,
          sameContact:
            !!movement.contact &&
            !!entry.contact &&
            movement.contact.toString() === entry.contact.toString(),
        sameCurrency: movementCurrency === entryCurrency,
        },
        score: Number(score.toFixed(4)),
      };
    })
    .filter(Boolean);

  return {
    movement: formatTreasuryMovement(movement, contacts),
    suggestions,
  };
};

const listOperationSuggestions = async ({ search = '', contactId = null, limit = 10 } = {}) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 30);
  const searchTerm = typeof search === 'string' ? search.trim() : '';
  const regex = searchTerm ? new RegExp(escapeRegex(searchTerm), 'i') : null;
  const contactFilter =
    contactId && mongoose.Types.ObjectId.isValid(contactId) ? new mongoose.Types.ObjectId(contactId) : null;

  const transferPipeline = [];

  if (contactFilter) {
    transferPipeline.push({
      $match: {
        'distributionLines.contact': contactFilter,
      },
    });
  }

  transferPipeline.push({
    $lookup: {
      from: 'clients',
      localField: 'distributionLines.contact',
      foreignField: '_id',
      as: 'contacts',
    },
  });

  if (regex) {
    const orFilters = [
      { operationCode: regex },
      { status: regex },
      { movementType: regex },
      { currency: regex },
      { direction: regex },
    ];

    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      orFilters.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
    }

    transferPipeline.push({
      $match: { $or: orFilters },
    });
  }

  transferPipeline.push(
    { $sort: { confirmedAt: -1, createdAt: -1 } },
    { $limit: sanitizedLimit },
    {
      $project: {
        operationCode: 1,
        movementType: 1,
        direction: 1,
        currency: 1,
        totalAmount: 1,
        distributionLines: 1,
        contacts: 1,
        status: 1,
        confirmedAt: 1,
        createdAt: 1,
      },
    }
  );

  const movementMatch = {
    status: 'registered',
  };

  if (contactFilter) {
    movementMatch.contact = contactFilter;
  }

  if (regex) {
    movementMatch.$or = [
      { movementCode: regex },
      { reference: regex },
      { description: regex },
      { currency: regex },
    ];
  }

  const transactionMatch = {
    status: { $in: ['pending', 'registered', 'completed'] },
  };

  if (contactFilter) {
    transactionMatch.client = contactFilter;
  }

  if (regex) {
    const txFilters = [
      { operationCode: regex },
      { status: regex },
      { type: regex },
      { 'incomingAsset.code': regex },
      { 'outgoingAsset.code': regex },
    ];

    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      txFilters.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
    }

    transactionMatch.$or = txFilters;
  }

  const [transferResults, movementResults, transactionResults] = await Promise.all([
    TransferOperation.aggregate(transferPipeline),
    TreasuryMovement.find(movementMatch)
      .sort({ movementAt: -1 })
      .limit(sanitizedLimit)
      .select({
        movementCode: 1,
        amount: 1,
        currency: 1,
        type: 1,
        medium: 1,
        status: 1,
        reference: 1,
        description: 1,
        movementAt: 1,
      })
      .lean(),
    Transaction.find(transactionMatch)
      .sort({ completedAt: -1, updatedAt: -1, createdAt: -1 })
      .limit(sanitizedLimit)
      .select({
        operationCode: 1,
        type: 1,
        status: 1,
        incomingAsset: 1,
        outgoingAsset: 1,
        incomingAmount: 1,
        outgoingAmount: 1,
        notes: 1,
        completedAt: 1,
        createdAt: 1,
        client: 1,
      })
      .lean(),
  ]);

  const transferSuggestions = transferResults
    .map((operation) => normalizeTransferToSuggestion(operation))
    .filter(Boolean);

  const movementSuggestions = movementResults
    .map((movement) => normalizeTreasuryMovementToSuggestion(movement))
    .filter(Boolean);

  const transactionSuggestions = transactionResults
    .map((tx) => normalizeTransactionToSuggestion(tx))
    .filter(Boolean);

  const merged = [...transferSuggestions, ...movementSuggestions, ...transactionSuggestions].sort((a, b) => {
    const aDate = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
    const bDate = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
    return bDate - aDate;
  });

  const seen = new Set();
  const deduped = merged.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return deduped.slice(0, sanitizedLimit);
};

exports.normalizeBalanceKey = normalizeBalanceKey;
exports.ensureBalance = ensureBalance;
exports.adjustTreasuryBalanceForMovement = adjustTreasuryBalanceForMovement;
exports.getTreasuryBalances = getTreasuryBalances;
exports.resolveMovementBalanceType = resolveMovementBalanceType;
exports.generateTreasuryMovementCode = generateTreasuryMovementCode;
exports.formatTreasuryMovement = formatTreasuryMovement;
exports.emitTreasuryMovementSideEffects = emitTreasuryMovementSideEffects;
exports.registerTreasuryMovement = registerTreasuryMovement;
exports.updateTreasuryMovement = updateTreasuryMovement;
exports.listTreasuryMovements = listTreasuryMovements;
exports.getTreasuryMovementById = getTreasuryMovementById;
exports.compensateTreasuryMovement = compensateTreasuryMovement;
exports.cancelTreasuryMovement = cancelTreasuryMovement;
exports.suggestCompensationsForMovement = suggestCompensationsForMovement;
exports.getLinkedBalancesSummary = getLinkedBalancesSummary;
exports.getLinkedBalanceDetail = getLinkedBalanceDetail;
exports.getGlobalBalancesOverview = getGlobalBalancesOverview;
exports.getContactBalanceDetail = getContactBalanceDetail;
exports.listTreasuryReceptions = listTreasuryReceptions;
exports.confirmTreasuryReception = confirmTreasuryReception;
exports.omitTreasuryReception = omitTreasuryReception;
exports.revertTreasuryReception = revertTreasuryReception;
exports.reserveCourierTransitBalance = reserveCourierTransitBalance;
exports.listOperationSuggestions = listOperationSuggestions;
