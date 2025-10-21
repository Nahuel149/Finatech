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

const MOVEMENT_MEDIUMS = ['cash', 'transfer', 'deposit'];
const MOVEMENT_TYPES = ['incoming', 'outgoing'];
const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

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
            const settlementPayload = {
              _id: movement._id,
              movementType: balanceMovementType,
              direction: movement.type,
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
