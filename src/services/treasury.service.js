const mongoose = require('mongoose');
const TreasuryBalance = require('../models/TreasuryBalance');
const TreasuryMovement = require('../models/TreasuryMovement');
const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const TransferOperation = require('../models/TransferOperation');
const AppError = require('../utils/AppError');
const CurrentAccountMovement = require('../models/CurrentAccountMovement');

const BALANCE_METADATA = {
  transfers: {
    label: 'Transferencias (ARS)',
    status: 'ok',
  },
  cash: {
    label: 'Efectivo (ARS)',
    status: 'ok',
  },
  usd: {
    label: 'Caja (USD)',
    status: 'warning',
  },
};

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

const MOVEMENT_MEDIUMS = ['cash', 'transfer', 'deposit'];
const MOVEMENT_TYPES = ['incoming', 'outgoing'];
const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

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
    currency,
    accountKey,
    counterpartKey: accountKey,
    dateFrom,
    dateTo,
  });

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        overviewAccountKey: {
          $ifNull: ['$counterpart.key', { $ifNull: ['$accountKey', 'general'] }],
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
    const label = resolveAccountLabel(accountKeyValue, currencyValue);
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
    accountKeys.set(row.accountKey, row.accountLabel);
    if (row.contact?.contactType) {
      contactTypesSet.add(row.contact.contactType);
    }
    if (BALANCE_STATE_VALUES.includes(row.balanceState)) {
      balanceStatesCount[row.balanceState] += 1;
    }

    if (!summaryByAccount.has(row.accountKey)) {
      summaryByAccount.set(row.accountKey, {
        id: row.accountKey,
        label: row.accountLabel,
        currency: row.currency,
        status: row.accountStatus || 'ok',
        amount: 0,
        updatedAt: row.lastMovementAt,
        currentWindowAmount: 0,
        previousWindowAmount: 0,
      });
    }
    const entry = summaryByAccount.get(row.accountKey);
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

  const summaryCards = Array.from(summaryByAccount.values()).map((entry) => {
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
    const order = ['transfers', 'cash', 'usd'];
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
      currency: currency || null,
      accountKey: accountKey || null,
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

  const totals = {
    balance: roundAmount(totalsEntry.balance || 0),
    incoming: {
      amount: roundAmount(totalsEntry.incoming || 0),
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

  const totalsByCurrencyList = totalsByCurrency.map((entry) => ({
    currency: entry._id,
    total: roundAmount(entry.total || 0),
  }));

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
    return {
      id: operation._id ? operation._id.toString() : null,
      createdAt: operation.createdAt ? new Date(operation.createdAt).toISOString() : null,
      currency: operation.currency,
      amount,
      direction: isIncoming ? 'incoming' : 'outgoing',
      operation: {
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

  return {
    contact: {
      id: contact._id ? contact._id.toString() : contactIdInput,
      fullName: contact.fullName,
      shortName: contact.shortName || contact.fullName,
      contactType: contact.contactType || 'client',
      status: contact.status || 'active',
      cuit: contact.cuit || null,
      updatedAt: totals.lastMovementAt,
    },
    summary: {
      balance: {
        amount: totals.balance,
        currency: currency ? String(currency).toUpperCase() : totalsByCurrencyList[0]?.currency || 'ARS',
      },
      variation,
      totals,
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
      totalsByCurrency: totalsByCurrencyList,
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

const fetchOperationLink = async (operationPayload, { session } = {}) => {
  if (!operationPayload) {
    return null;
  }

  const typeInput =
    operationPayload.type ||
    operationPayload.operationType ||
    operationPayload.model ||
    operationPayload.source;

  const normalizedType =
    typeof typeInput === 'string' && typeInput.toLowerCase().includes('transfer')
      ? 'TransferOperation'
      : 'Transaction';

  const id =
    operationPayload.id || operationPayload.operationId || operationPayload.referenceId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('La operación asociada no es válida.', 400);
  }

  const Model = normalizedType === 'TransferOperation' ? TransferOperation : Transaction;
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

const registerTreasuryMovement = async (payload = {}, context = {}) => {
  const session = await mongoose.startSession();
  let movementDocument;
  let contactForResponse = null;
  let operationLinkEntry = null;
  let balanceSnapshot = null;

  try {
    await session.withTransaction(async () => {
      const normalized = await validateAndNormalizeMovementPayload(payload, { session });
      const applySettlement = getApplyTreasurySettlement();

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
      }

      await movement.save({ session });

      const delta = movement.type === 'incoming' ? normalized.amount : -normalized.amount;
      balanceSnapshot = await adjustTreasuryBalanceForMovement(
        balanceMovementType,
        normalized.currency,
        delta,
        {
          session,
          userId: context.userId,
        }
      );

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
            // Map transaction type to treasury direction: buy -> outgoing (ARS leaves), sell -> incoming (ARS enters)
            const transactionType = normalized.operationLink.document.type;
            const treasuryDirection = transactionType === 'buy' ? 'outgoing' : 'incoming';
            
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
          }
        }
      }

      if (movement.linkedOperations && movement.linkedOperations.length > 0) {
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
    });
  } finally {
    session.endSession();
  }

  const formattedMovement = formatTreasuryMovement(movementDocument, contactForResponse ? [contactForResponse] : []);

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
    const pattern = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { movementCode: pattern },
      { reference: pattern },
      { description: pattern },
      { 'linkedOperations.code': pattern },
    ];
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

  const [totalItems, movements, totals] = await Promise.all([
    TreasuryMovement.countDocuments(query),
    TreasuryMovement.find(query)
      .sort(sort)
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean(),
    TreasuryMovement.aggregate([
      { $match: query },
      {
        $group: {
          _id: { currency: '$currency', type: '$type' },
          amount: { $sum: '$amount' },
        },
      },
    ]),
  ]);

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
          const operationAmount =
            operationLink.model === 'Transaction'
              ? deriveTransactionAmountForCurrency(operationLink.document, movement.currency) ||
                amount
              : Number(operationLink.document.totalAmount || amount);

          movement.linkedOperations.push({
            id: operationLink.document._id,
            model: operationLink.model,
            code:
              operationLink.document.operationCode ||
              operationLink.document.movementCode ||
              null,
            type:
              operationLink.model === 'Transaction'
                ? operationLink.document.type
                : operationLink.document.movementType,
            currency: movement.currency,
            amount: roundAmount(operationAmount || amount),
            matchedAt: new Date(),
            matchedBy:
              context.userId && mongoose.Types.ObjectId.isValid(context.userId)
                ? context.userId
                : null,
          });
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

  return formatTreasuryMovement(
    updatedDocument,
    contactForResponse ? [contactForResponse] : []
  );
};

const cancelTreasuryMovement = async (movementId, { reason } = {}, context = {}) => {
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
        throw new AppError('El movimiento ya se encuentra anulado.', 409);
      }

      const balanceMovementType = resolveMovementBalanceType(movement.currency, movement.medium);
      const delta = movement.type === 'incoming' ? movement.amount : -movement.amount;

      await adjustTreasuryBalanceForMovement(balanceMovementType, movement.currency, -delta, {
        session,
        userId: context.userId,
      });

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
      movement.cancellationReason =
        typeof reason === 'string' && reason.trim().length ? reason.trim() : null;

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

      await movement.save({ session });
      updatedDocument = movement.toObject();
    });
  } finally {
    session.endSession();
  }

  return formatTreasuryMovement(
    updatedDocument,
    contactForResponse ? [contactForResponse] : []
  );
};

const suggestCompensationsForMovement = async (movementId, { limit = 10 } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(movementId)) {
    throw new AppError('El identificador de movimiento es inválido.', 400);
  }

  const movement = await TreasuryMovement.findById(movementId).lean();
  if (!movement) {
    throw new AppError('El movimiento indicado no existe.', 404);
  }

  const query = {
    ledger: 'contact',
    currency: movement.currency,
    stage: 'registration',
  };

  if (movement.contact) {
    query.contact = movement.contact;
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

  const suggestions = candidateMovements.map((entry) => {
    const absoluteMovementAmount = Math.abs(Number(movement.amount) || 0);
    const absoluteEntryAmount = Math.abs(Number(entry.amount) || 0);
    const amountDifference = roundAmount(Math.abs(absoluteMovementAmount - absoluteEntryAmount));
    const ratio =
      absoluteMovementAmount > 0 ? amountDifference / absoluteMovementAmount : amountDifference;

    const createdAt = entry.createdAt ? new Date(entry.createdAt) : null;
    const movementDate = movement.movementAt ? new Date(movement.movementAt) : null;
    const daysDifference =
      createdAt && movementDate
        ? Math.round(Math.abs(createdAt.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const transaction = entry.operation?.source === 'transaction'
      ? transactionMap.get(entry.operation.id?.toString())
      : null;

    const contactDoc = entry.contact ? contactMap.get(entry.contact.toString()) : null;

    const score =
      1 /
      (1 +
        amountDifference +
        (movement.contact && entry.contact && movement.contact.toString() === entry.contact.toString() ? 0 : 0.5) +
        (daysDifference || 0) * 0.1);

    return {
      currentAccountMovementId: entry._id.toString(),
      amount: roundAmount(entry.amount),
      stage: entry.stage,
      createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : null,
      operation: entry.operation || null,
      transaction: transaction
        ? {
            id: transaction._id.toString(),
            type: transaction.type,
            operationCode: transaction.operationCode || null,
          }
        : null,
      contact: contactDoc ? formatContact(contactDoc) : null,
      match: {
        amountDifference,
        ratio: Number(ratio.toFixed(4)),
        daysDifference,
        sameContact:
          !!movement.contact &&
          !!entry.contact &&
          movement.contact.toString() === entry.contact.toString(),
        sameCurrency: movement.currency === entry.currency,
      },
      score: Number(score.toFixed(4)),
    };
  });

  return {
    movement: formatTreasuryMovement(movement, contacts),
    suggestions,
  };
};

exports.normalizeBalanceKey = normalizeBalanceKey;
exports.ensureBalance = ensureBalance;
exports.adjustTreasuryBalanceForMovement = adjustTreasuryBalanceForMovement;
exports.getTreasuryBalances = getTreasuryBalances;
exports.resolveMovementBalanceType = resolveMovementBalanceType;
exports.generateTreasuryMovementCode = generateTreasuryMovementCode;
exports.formatTreasuryMovement = formatTreasuryMovement;
exports.registerTreasuryMovement = registerTreasuryMovement;
exports.listTreasuryMovements = listTreasuryMovements;
exports.getTreasuryMovementById = getTreasuryMovementById;
exports.compensateTreasuryMovement = compensateTreasuryMovement;
exports.cancelTreasuryMovement = cancelTreasuryMovement;
exports.suggestCompensationsForMovement = suggestCompensationsForMovement;
exports.getLinkedBalancesSummary = getLinkedBalancesSummary;
exports.getLinkedBalanceDetail = getLinkedBalanceDetail;
exports.getGlobalBalancesOverview = getGlobalBalancesOverview;
exports.getContactBalanceDetail = getContactBalanceDetail;
