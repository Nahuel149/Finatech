const mongoose = require('mongoose');
const CurrentAccountBalance = require('../models/CurrentAccountBalance');
const ContactBalance = require('../models/ContactBalance');
const CurrentAccountMovement = require('../models/CurrentAccountMovement');
const Client = require('../models/Client');
const { normalizeBalanceKey } = require('./treasury.service');

const ACCOUNT_KEY = 'accounts_receivable';

const roundAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
};

const ensureAccountBalance = async (accountKey, currency, { session } = {}) => {
  await CurrentAccountBalance.updateOne(
    { accountKey, currency },
    {
      $setOnInsert: {
        accountKey,
        currency,
        amount: 0,
      },
    },
    { upsert: true, session }
  );
};

const ensureContactBalance = async (contactId, currency, { session } = {}) => {
  await ContactBalance.updateOne(
    { contact: contactId, currency },
    {
      $setOnInsert: {
        contact: contactId,
        currency,
        amount: 0,
      },
    },
    { upsert: true, session }
  );
};

const adjustAccountBalance = async (accountKey, currency, delta, { session, userId } = {}) => {
  const numericDelta = roundAmount(delta);
  if (!Number.isFinite(numericDelta) || numericDelta === 0) {
    return null;
  }

  const normalizedKey = String(accountKey || ACCOUNT_KEY).toLowerCase();
  const normalizedCurrency = String(currency || 'ARS').toUpperCase();

  await ensureAccountBalance(normalizedKey, normalizedCurrency, { session });

  const balance = await CurrentAccountBalance.findOne({
    accountKey: normalizedKey,
    currency: normalizedCurrency,
  }).session(session || null);

  const currentAmount = Number(balance?.amount || 0);
  const nextAmount = roundAmount(currentAmount + numericDelta);

  balance.amount = nextAmount;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    balance.updatedBy = userId;
  }

  await balance.save({ session });
  return balance.toObject();
};

const adjustContactBalance = async (contactId, currency, delta, { session, userId } = {}) => {
  if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
    return null;
  }

  const numericDelta = roundAmount(delta);
  if (!Number.isFinite(numericDelta) || numericDelta === 0) {
    return null;
  }

  const normalizedCurrency = String(currency || 'ARS').toUpperCase();
  await ensureContactBalance(contactId, normalizedCurrency, { session });

  const balance = await ContactBalance.findOne({
    contact: contactId,
    currency: normalizedCurrency,
  }).session(session || null);

  const currentAmount = Number(balance?.amount || 0);
  const nextAmount = roundAmount(currentAmount + numericDelta);

  balance.amount = nextAmount;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    balance.updatedBy = userId;
  }

  await balance.save({ session });
  return balance.toObject();
};

const registerMovements = async (entries = [], { session } = {}) => {
  if (!entries.length) {
    return [];
  }
  const formattedEntries = entries.map((entry) => ({
    ...entry,
    amount: roundAmount(entry.amount),
  }));
  const created = await CurrentAccountMovement.insertMany(formattedEntries, {
    session,
  });
  return created.map((doc) => doc.toObject());
};

const extractCurrencyAndAmountFromTransaction = (transaction) => {
  if (!transaction) {
    return null;
  }

  const prioritize = (codes = []) => (assetField, amountField) => {
    const asset = transaction[assetField];
    const amount = transaction[amountField];
    if (!asset || !asset.code) {
      return null;
    }
    const normalizedCode = asset.code.toUpperCase();
    if (!codes.includes(normalizedCode)) {
      return null;
    }
    return { currency: normalizedCode, amount: Number(amount) };
  };

  const tryUsd = prioritize(['USD']);
  const tryArs = prioritize(['ARS']);

  return (
    tryUsd('incomingAsset', 'incomingAmount') ||
    tryUsd('outgoingAsset', 'outgoingAmount') ||
    tryArs('incomingAsset', 'incomingAmount') ||
    tryArs('outgoingAsset', 'outgoingAmount')
  );
};

const applyTransactionRegistration = async (transaction, { session, userId } = {}) => {
  const info = extractCurrencyAndAmountFromTransaction(transaction);
  if (!info || !Number.isFinite(info.amount) || info.amount <= 0) {
    return null;
  }

  const currency = info.currency;
  const amount = roundAmount(info.amount);
  const delta = transaction.type === 'buy' ? amount : -amount;

  const operationRef = {
    id: transaction._id,
    code: transaction.operationCode || null,
    type: transaction.type || null,
    source: 'transaction',
  };

  const metadata = {
    incomingAsset: transaction.incomingAsset?.code || null,
    outgoingAsset: transaction.outgoingAsset?.code || null,
    subtype: transaction.subtype || null,
  };

  await adjustAccountBalance(ACCOUNT_KEY, currency, delta, { session, userId });

  const movements = [
    {
      ledger: 'general',
      accountKey: ACCOUNT_KEY,
      currency,
      amount: delta,
      stage: 'registration',
      operation: operationRef,
      counterpart: {
        type: 'contact',
        id: mongoose.Types.ObjectId.isValid(transaction.client)
          ? transaction.client
          : null,
      },
      metadata,
      performedBy: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    },
  ];

  const contactId =
    transaction.client && typeof transaction.client === 'object' && transaction.client._id
      ? transaction.client._id
      : transaction.client;

  if (contactId && mongoose.Types.ObjectId.isValid(contactId)) {
    await adjustContactBalance(contactId, currency, delta, { session, userId });
    movements.push({
      ledger: 'contact',
      accountKey: ACCOUNT_KEY,
      contact: contactId,
      currency,
      amount: delta,
      stage: 'registration',
      operation: operationRef,
      counterpart: {
        type: 'account',
        key: ACCOUNT_KEY,
      },
      metadata,
      performedBy: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    });
  }

  await registerMovements(movements, { session });
  return { currency, delta };
};

const applyTreasurySettlement = async (operationDoc, { session, userId } = {}) => {
  if (!operationDoc) {
    return null;
  }

  const currency = String(operationDoc.currency || 'ARS').toUpperCase();
  const totalAmount = roundAmount(operationDoc.totalAmount || operationDoc.amount || 0);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    return null;
  }

  const direction = operationDoc.direction === 'outgoing' ? 'outgoing' : 'incoming';
  const delta = direction === 'incoming' ? -totalAmount : totalAmount;

  const operationRef = {
    id: operationDoc._id || operationDoc.id || null,
    code: operationDoc.operationCode || operationDoc.code || null,
    type: operationDoc.movementType || null,
    source: 'treasury',
  };

  const counterpartKey = normalizeBalanceKey(operationDoc.movementType || 'cash');

  await adjustAccountBalance(ACCOUNT_KEY, currency, delta, { session, userId });

  const movements = [
    {
      ledger: 'general',
      accountKey: ACCOUNT_KEY,
      currency,
      amount: delta,
      stage: 'settlement',
      operation: operationRef,
      counterpart: {
        type: 'treasury_balance',
        key: counterpartKey,
      },
      metadata: {
        direction,
        movementType: operationDoc.movementType,
      },
      performedBy: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
    },
  ];

  const lines = Array.isArray(operationDoc.distributionLines)
    ? operationDoc.distributionLines
    : Array.isArray(operationDoc.payload?.contacts)
    ? operationDoc.payload.contacts
    : [];

  await Promise.all(
    lines.map(async (line) => {
      const contactId =
        line.contact && typeof line.contact === 'object' && line.contact._id
          ? line.contact._id
          : line.contact || line.contactId;

      if (!mongoose.Types.ObjectId.isValid(contactId)) {
        return;
      }

      const amount = Number(line.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      const contactDelta = direction === 'incoming' ? -roundAmount(amount) : roundAmount(amount);

      await adjustContactBalance(contactId, currency, contactDelta, { session, userId });

      movements.push({
        ledger: 'contact',
        accountKey: ACCOUNT_KEY,
        contact: contactId,
        currency,
        amount: contactDelta,
        stage: 'settlement',
        operation: operationRef,
        counterpart: {
          type: 'treasury_balance',
          key: counterpartKey,
        },
        metadata: {
          direction,
          movementType: operationDoc.movementType,
        },
        performedBy: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : null,
      });
    })
  );

  await registerMovements(movements, { session });
  return { currency, delta };
};

const getCurrentAccountSummary = async ({ topContacts = 5 } = {}) => {
  const clientCollectionName =
    Client.collection?.name || Client.collection?.collectionName || 'clients';

  const [balances, contactBalances] = await Promise.all([
    CurrentAccountBalance.find({})
      .sort({ accountKey: 1, currency: 1 })
      .lean(),
    ContactBalance.aggregate([
      {
        $addFields: {
          absAmount: { $abs: '$amount' },
        },
      },
      { $match: { absAmount: { $gt: 0 } } },
      { $sort: { absAmount: -1 } },
      { $limit: Math.max(Number(topContacts) || 5, 1) },
      {
        $lookup: {
          from: clientCollectionName,
          localField: 'contact',
          foreignField: '_id',
          as: 'contactDocuments',
        },
      },
      { $unwind: { path: '$contactDocuments', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          contactId: '$contact',
          currency: 1,
          amount: 1,
          updatedAt: 1,
          contact: {
            id: '$contactDocuments._id',
            fullName: '$contactDocuments.fullName',
            shortName: '$contactDocuments.shortName',
            contactType: '$contactDocuments.contactType',
          },
        },
      },
    ]),
  ]);

  const totalsByCurrency = balances.reduce((acc, balance) => {
    const currency = balance.currency;
    acc[currency] = roundAmount((acc[currency] || 0) + Number(balance.amount || 0));
    return acc;
  }, {});

  const findBalance = (currency) =>
    balances.find((balance) => balance.currency === currency) || null;

  const receivableUsd = findBalance('USD');
  const receivableArs = findBalance('ARS');

  return {
    generatedAt: new Date().toISOString(),
    balances: balances.map((balance) => ({
      accountKey: balance.accountKey,
      currency: balance.currency,
      amount: roundAmount(balance.amount || 0),
      updatedAt: balance.updatedAt,
    })),
    totalsByCurrency,
    accounts: {
      receivableUsd: receivableUsd
        ? {
            currency: 'USD',
            amount: roundAmount(receivableUsd.amount || 0),
            updatedAt: receivableUsd.updatedAt,
            variation: 0,
          }
        : {
            currency: 'USD',
            amount: 0,
            updatedAt: null,
            variation: 0,
          },
      receivableArs: receivableArs
        ? {
            currency: 'ARS',
            amount: roundAmount(receivableArs.amount || 0),
            updatedAt: receivableArs.updatedAt,
            variation: 0,
          }
        : {
            currency: 'ARS',
            amount: 0,
            updatedAt: null,
            variation: 0,
          },
    },
    topContacts: contactBalances.map((entry) => ({
      contactId: entry.contactId?.toString() || null,
      currency: entry.currency,
      amount: roundAmount(entry.amount || 0),
      updatedAt: entry.updatedAt,
      contact: entry.contact
        ? {
            id: entry.contact.id ? entry.contact.id.toString() : null,
            fullName: entry.contact.fullName || entry.contact.shortName || '',
            shortName: entry.contact.shortName || entry.contact.fullName || '',
            contactType: entry.contact.contactType || 'client',
          }
        : null,
    })),
  };
};

const listCurrentAccountMovements = async ({
  ledger,
  currency,
  limit = 20,
  skip = 0,
} = {}) => {
  const query = {};
  if (ledger && ['general', 'contact'].includes(ledger)) {
    query.ledger = ledger;
  }
  if (currency) {
    query.currency = currency.toUpperCase();
  }

  const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const sanitizedSkip = Math.max(Number(skip) || 0, 0);

  const [total, movements] = await Promise.all([
    CurrentAccountMovement.countDocuments(query),
    CurrentAccountMovement.find(query)
      .sort({ createdAt: -1 })
      .skip(sanitizedSkip)
      .limit(sanitizedLimit)
      .lean(),
  ]);

  const contactIds = movements
    .filter((movement) => movement.contact)
    .map((movement) => movement.contact)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } })
        .select({ fullName: 1, shortName: 1, contactType: 1 })
        .lean()
    : [];

  const contactMap = new Map(contacts.map((contact) => [contact._id.toString(), contact]));

  const formatted = movements.map((movement) => ({
    id: movement._id.toString(),
    ledger: movement.ledger,
    accountKey: movement.accountKey,
    contact: movement.contact
      ? (() => {
          const data = contactMap.get(movement.contact.toString());
          return data
            ? {
                id: movement.contact.toString(),
                fullName: data.fullName,
                shortName: data.shortName || data.fullName,
                contactType: data.contactType,
              }
            : { id: movement.contact.toString() };
        })()
      : null,
    currency: movement.currency,
    amount: roundAmount(movement.amount),
    stage: movement.stage,
    operation: movement.operation,
    counterpart: movement.counterpart,
    metadata: movement.metadata,
    performedBy: movement.performedBy ? movement.performedBy.toString() : null,
    createdAt: movement.createdAt,
  }));

  return {
    total,
    pageSize: sanitizedLimit,
    items: formatted,
  };
};

const buildBalanceSignMatch = (balanceSign) => {
  if (balanceSign === 'positive') {
    return { amount: { $gt: 0.009 } };
  }
  if (balanceSign === 'negative') {
    return { amount: { $lt: -0.009 } };
  }
  if (balanceSign === 'zero') {
    return {
      amount: {
        $gte: -0.009,
        $lte: 0.009,
      },
    };
  }
  return null;
};

const buildContactSearchStage = (search) => {
  if (!search) {
    return null;
  }
  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $match: {
      $or: [
        { 'contactDoc.fullName': regex },
        { 'contactDoc.shortName': regex },
        { 'contactDoc.cuit': regex },
      ],
    },
  };
};

const listContactBalancesDetailed = async ({
  currency = 'USD',
  contactType,
  status,
  balanceSign,
  sortBy = 'amount',
  sortDirection = 'desc',
  page = 1,
  limit = 25,
  search,
  dateFrom,
  dateTo,
} = {}) => {
  const normalizedCurrency = currency ? currency.toUpperCase() : 'USD';
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const sanitizedPage = Math.max(Number(page) || 1, 1);
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  const clientCollectionName =
    Client.collection?.name || Client.collection?.collectionName || 'clients';
  const movementCollectionName = CurrentAccountMovement.collection?.name || 'currentaccountmovements';

  const pipeline = [
    { $match: { currency: normalizedCurrency } },
    {
      $lookup: {
        from: clientCollectionName,
        localField: 'contact',
        foreignField: '_id',
        as: 'contactDoc',
      },
    },
    { $unwind: { path: '$contactDoc', preserveNullAndEmptyArrays: true } },
  ];

  if (search) {
    const searchStage = buildContactSearchStage(search);
    if (searchStage) pipeline.push(searchStage);
  }

  if (contactType && ['client', 'provider'].includes(contactType)) {
    pipeline.push({ $match: { 'contactDoc.contactType': contactType } });
  }

  if (status && ['active', 'inactive'].includes(status)) {
    pipeline.push({ $match: { 'contactDoc.status': status } });
  }

  const balanceFilter = buildBalanceSignMatch(balanceSign);
  if (balanceFilter) {
    pipeline.push({ $match: balanceFilter });
  }

  const movementMatchAnd = [
    { $eq: ['$contact', '$$contactId'] },
    { $eq: ['$currency', '$$currency'] },
  ];

  if (dateFrom) {
    movementMatchAnd.push({ $gte: ['$createdAt', new Date(dateFrom)] });
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    movementMatchAnd.push({ $lte: ['$createdAt', toDate] });
  }

  pipeline.push({
    $lookup: {
      from: movementCollectionName,
      let: { contactId: '$contact', currency: '$currency' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: movementMatchAnd,
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
      ],
      as: 'lastMovement',
    },
  });

  pipeline.push({
    $addFields: {
      lastMovement: { $arrayElemAt: ['$lastMovement', 0] },
      lastOperationAt: { $arrayElemAt: ['$lastMovement.createdAt', 0] },
      lastOperationStage: { $ifNull: ['$lastMovement.stage', null] },
      lastOperationType: { $ifNull: ['$lastMovement.operation.type', null] },
      lastOperationSource: { $ifNull: ['$lastMovement.operation.source', null] },
      contactType: '$contactDoc.contactType',
      contactStatus: '$contactDoc.status',
      contactName: {
        $ifNull: ['$contactDoc.shortName', '$contactDoc.fullName'],
      },
    },
  });

  if (dateFrom || dateTo) {
    pipeline.push({ $match: { lastOperationAt: { $ne: null } } });
  }

  const sortMap = {
    amount: { amount: sortDirection === 'asc' ? 1 : -1 },
    name: { contactName: sortDirection === 'asc' ? 1 : -1 },
    lastOperation: { lastOperationAt: sortDirection === 'asc' ? 1 : -1 },
    contactType: { contactType: sortDirection === 'asc' ? 1 : -1 },
  };

  const sortStage = sortMap[sortBy] || sortMap.amount;

  pipeline.push({ $sort: sortStage });

  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: sanitizedLimit }],
      totalCount: [{ $count: 'value' }],
    },
  });

  pipeline.push({
    $project: {
      data: 1,
      totalItems: { $ifNull: [{ $arrayElemAt: ['$totalCount.value', 0] }, 0] },
    },
  });

  const [aggregateResult] = await ContactBalance.aggregate(pipeline);
  const data = aggregateResult?.data || [];
  const totalItems = aggregateResult?.totalItems || 0;

  const items = data.map((entry) => ({
    contactId: entry.contact?.toString(),
    currency: entry.currency,
    amount: roundAmount(entry.amount || 0),
    updatedAt: entry.updatedAt,
    balanceSign:
      roundAmount(entry.amount || 0) > 0
        ? 'positive'
        : roundAmount(entry.amount || 0) < 0
        ? 'negative'
        : 'zero',
    contact: entry.contactDoc
      ? {
          id: entry.contactDoc._id ? entry.contactDoc._id.toString() : null,
          fullName: entry.contactDoc.fullName || entry.contactDoc.shortName || '',
          shortName: entry.contactDoc.shortName || entry.contactDoc.fullName || '',
          contactType: entry.contactDoc.contactType || 'client',
          status: entry.contactDoc.status || 'active',
        }
      : null,
    lastOperation: entry.lastMovement
      ? {
          id: entry.lastMovement._id ? entry.lastMovement._id.toString() : null,
          createdAt: entry.lastMovement.createdAt,
          stage: entry.lastMovement.stage,
          currency: entry.lastMovement.currency,
          amount: roundAmount(entry.lastMovement.amount || 0),
          operation: entry.lastMovement.operation || null,
          state: mapStageToState(entry.lastMovement.stage),
        }
      : null,
  }));

  return {
    currency: normalizedCurrency,
    page: sanitizedPage,
    pageSize: sanitizedLimit,
    totalItems,
    totalPages: Math.max(1, Math.ceil((totalItems || 0) / sanitizedLimit)),
    items,
  };
};

const deriveOperationLabel = (movement) => {
  if (!movement || !movement.operation) {
    return {
      type: 'desconocido',
      source: null,
    };
  }

  const { operation, stage, metadata } = movement;
  if (operation.source === 'transaction') {
    if (operation.type === 'buy') {
      return { type: 'compra', source: 'transaction' };
    }
    if (operation.type === 'sell') {
      return { type: 'venta', source: 'transaction' };
    }
  }

  if (operation.source === 'treasury') {
    const movementType = metadata?.movementType || operation.type;
    if (movementType === 'cash') {
      return { type: stage === 'settlement' ? 'compensacion_caja' : 'caja', source: 'treasury' };
    }
    if (movementType === 'transfer') {
      return {
        type: stage === 'settlement' ? 'compensacion_transferencia' : 'transferencia',
        source: 'treasury',
      };
    }
    return { type: 'tesoreria', source: 'treasury' };
  }

  return { type: operation.type || 'desconocido', source: operation.source || null };
};

const mapStageToState = (stage) => {
  if (stage === 'settlement') return 'compensada';
  if (stage === 'registration') return 'registrada';
  return stage || 'desconocido';
};

const getContactBalanceDetail = async ({
  contactId,
  currency,
  operationType,
  operationSource,
  state,
  sortBy = 'date',
  sortDirection = 'desc',
  page = 1,
  limit = 25,
  dateFrom,
  dateTo,
} = {}) => {
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    throw new Error('Identificador de contacto inválido');
  }

  const contact = await Client.findById(contactId).lean();
  if (!contact) {
    throw new Error('El contacto no existe');
  }

  const balances = await ContactBalance.find({ contact: contact._id }).lean();
  const balanceMap = balances.reduce((acc, balance) => {
    acc[balance.currency] = roundAmount(balance.amount || 0);
    return acc;
  }, {});

  const availableCurrencies = Object.keys(balanceMap);
  const selectedCurrency = currency
    ? currency.toUpperCase()
    : availableCurrencies.includes('USD')
    ? 'USD'
    : availableCurrencies.includes('ARS')
    ? 'ARS'
    : 'USD';

  const query = {
    contact: contact._id,
  };

  if (selectedCurrency) {
    query.currency = selectedCurrency;
  }

  if (state) {
    if (state === 'registrada') {
      query.stage = 'registration';
    } else if (state === 'compensada') {
      query.stage = 'settlement';
    }
  }

  if (operationSource) {
    query['operation.source'] = operationSource;
  }

  if (operationType) {
    if (['buy', 'sell'].includes(operationType)) {
      query['operation.source'] = 'transaction';
      query['operation.type'] = operationType;
    } else if (operationType === 'cash' || operationType === 'transfer') {
      query['operation.source'] = 'treasury';
      query['metadata.movementType'] = operationType === 'cash' ? 'cash' : 'transfer';
    } else if (operationType === 'settlement') {
      query.stage = 'settlement';
    }
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  const sanitizedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const sanitizedPage = Math.max(Number(page) || 1, 1);
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  const sortMap = {
    date: { createdAt: sortDirection === 'asc' ? 1 : -1 },
    amount: { amount: sortDirection === 'asc' ? 1 : -1 },
    type: { 'operation.type': sortDirection === 'asc' ? 1 : -1 },
  };

  const sortStage = sortMap[sortBy] || sortMap.date;

  const [totalItems, operations] = await Promise.all([
    CurrentAccountMovement.countDocuments(query),
    CurrentAccountMovement.find(query)
      .sort(sortStage)
      .skip(skip)
      .limit(sanitizedLimit)
      .lean(),
  ]);

  const totals = await CurrentAccountMovement.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        incoming: {
          $sum: {
            $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
          },
        },
        outgoing: {
          $sum: {
            $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
          },
        },
      },
    },
  ]);

  const totalsData = totals.length
    ? {
        incoming: roundAmount(totals[0].incoming || 0),
        outgoing: roundAmount(totals[0].outgoing || 0),
        net: roundAmount((totals[0].incoming || 0) - (totals[0].outgoing || 0)),
      }
    : {
        incoming: 0,
        outgoing: 0,
        net: 0,
      };

  const items = operations.map((movement) => {
    const label = deriveOperationLabel(movement);
    return {
      id: movement._id.toString(),
      date: movement.createdAt,
      currency: movement.currency,
      amount: roundAmount(movement.amount),
      stage: movement.stage,
      state: mapStageToState(movement.stage),
      operation: {
        type: label.type,
        source: label.source,
        raw: movement.operation || null,
      },
      metadata: movement.metadata || {},
    };
  });

  return {
    contact: {
      id: contact._id.toString(),
      fullName: contact.fullName,
      shortName: contact.shortName || contact.fullName,
      contactType: contact.contactType,
      status: contact.status,
    },
    balances: balanceMap,
    selectedCurrency,
    totals: totalsData,
    operations: {
      page: sanitizedPage,
      pageSize: sanitizedLimit,
      totalItems,
      totalPages: Math.max(1, Math.ceil((totalItems || 0) / sanitizedLimit)),
      items,
    },
  };
};

module.exports = {
  ACCOUNT_KEY,
  applyTransactionRegistration,
  applyTreasurySettlement,
  adjustAccountBalance,
  adjustContactBalance,
  getCurrentAccountSummary,
  listCurrentAccountMovements,
  listContactBalancesDetailed,
  getContactBalanceDetail,
};
