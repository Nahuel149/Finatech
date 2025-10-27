const mongoose = require('mongoose');
const TransferOperation = require('../models/TransferOperation');
const Client = require('../models/Client');
const AppError = require('../utils/AppError');
const {
  adjustTreasuryBalanceForMovement,
  normalizeBalanceKey,
} = require('./treasury.service');
const { createTransferOperationEvents } = require('./treasuryEvent.service');
const { applyTreasurySettlement } = require('./currentAccount.service');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const roundAmount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100) / 100;
};

const formatContact = (client) => {
  if (!client) {
    return null;
  }

  const id =
    client._id && typeof client._id === 'object' && client._id.toString
      ? client._id.toString()
      : client._id || client.id;

  return {
    id,
    fullName: client.fullName || client.shortName || client.displayName || '',
    shortName: client.shortName || client.fullName || '',
    contactType: client.contactType || 'client',
  };
};

const formatTransferOperation = (operation, contacts = []) => {
  if (!operation) {
    return null;
  }

  const contactMap = new Map();
  contacts
    .map(formatContact)
    .filter(Boolean)
    .forEach((contact) => {
      contactMap.set(contact.id, contact);
    });

  const distributionLines = Array.isArray(operation.distributionLines)
    ? operation.distributionLines.map((line, index) => {
        const contactId =
          line.contact && typeof line.contact === 'object' && line.contact._id
            ? line.contact._id.toString()
            : line.contact
            ? line.contact.toString()
            : null;

        const contact = contactMap.get(contactId) || formatContact(line.contact);

        return {
          lineId: `${operation._id.toString()}-${index}`,
          contactId,
          contactName: contact?.shortName || contact?.fullName || null,
          contactType: contact?.contactType || null,
          method: line.method,
          amount: roundAmount(line.amount),
        };
      })
    : [];

  return {
    id: operation._id.toString(),
    operationCode: operation.operationCode || null,
    movementType: operation.movementType,
    direction: operation.direction,
    currency: operation.currency,
    totalAmount: roundAmount(operation.totalAmount),
    distributionLines,
    status: operation.status,
    confirmedAt: operation.confirmedAt
      ? new Date(operation.confirmedAt).toISOString()
      : null,
    createdAt: operation.createdAt ? new Date(operation.createdAt).toISOString() : null,
    updatedAt: operation.updatedAt ? new Date(operation.updatedAt).toISOString() : null,
  };
};

const generateTransferOperationCode = async () => {
  const prefix = 'FT-TRF-';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await TransferOperation.exists({ operationCode: code });
    if (!exists) {
      return code;
    }
  }
  return `${prefix}${Date.now()}`;
};

const validateAndNormalizePayload = async (payload = {}) => {
  const movementType = payload.movementType === 'cash' ? 'cash' : 'transfer';
  const direction = payload.direction === 'outgoing' ? 'outgoing' : 'incoming';
  const totalAmount = roundAmount(payload.totalAmount);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new AppError('Ingresá un monto total válido.', 400);
  }

  const lines = Array.isArray(payload.distributionLines) ? payload.distributionLines : [];
  if (lines.length === 0) {
    throw new AppError('Agregá al menos un contacto a la distribución.', 400);
  }

  const normalizedLines = lines.map((line, index) => {
    const contactId = line.contactId || line.contact || null;
    if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
      throw new AppError(`La línea ${index + 1} no tiene un contacto válido.`, 400);
    }
    const method = line.method === 'USD' ? 'USD' : 'ARS';
    const amount = roundAmount(line.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(`Ingresá un monto válido en la línea ${index + 1}.`, 400);
    }

    return {
      contact: new mongoose.Types.ObjectId(contactId),
      method,
      amount,
    };
  });

  const assignedTotal = normalizedLines.reduce((sum, line) => sum + line.amount, 0);
  const difference = Math.abs(assignedTotal - totalAmount);

  if (difference >= 0.01) {
    throw new AppError(
      `La suma de las asignaciones debe coincidir con el monto total. Diferencia: ${difference.toFixed(
        2
      )}`,
      400
    );
  }

  const contactIds = normalizedLines.map((line) => line.contact);
  const contacts = await Client.find({ _id: { $in: contactIds } }).lean();
  if (contacts.length !== normalizedLines.length) {
    throw new AppError('Uno de los contactos seleccionados ya no está disponible.', 400);
  }

  const contactsMap = new Map(contacts.map((client) => [client._id.toString(), client]));

  return {
    movementType,
    direction,
    totalAmount,
    normalizedLines,
    contacts,
    contactsMap,
  };
};

const registerTransferOperation = async (payload, context = {}) => {
  const { movementType, direction, totalAmount, normalizedLines, contacts } =
    await validateAndNormalizePayload(payload);

  const session = await mongoose.startSession();
  let operationDocument;
  let balance;
  let eventDocuments = [];

  try {
    await session.withTransaction(async () => {
      const operation = new TransferOperation({
        operationCode: await generateTransferOperationCode(),
        movementType,
        direction,
        currency: 'ARS',
      totalAmount,
      distributionLines: normalizedLines,
      status: 'registered',
      confirmedAt: new Date(),
      createdBy: context.userId || null,
      updatedBy: context.userId || null,
    });

    await operation.save({ session });
    operationDocument = operation;

    const delta = direction === 'incoming' ? totalAmount : -totalAmount;
    balance = await adjustTreasuryBalanceForMovement(movementType, 'ARS', delta, {
      userId: context.userId,
      session,
    });

      await applyTreasurySettlement(operationDocument.toObject(), {
        session,
        userId: context.userId,
      });

      eventDocuments = await createTransferOperationEvents(operationDocument, { session });
    });
  } finally {
    session.endSession();
  }

  const formattedOperation = formatTransferOperation(operationDocument.toObject(), contacts);

  return {
    operation: formattedOperation,
    balance: balance
      ? {
          id: normalizeBalanceKey(movementType),
          currency: balance.currency,
          amount: roundAmount(balance.amount),
          updatedAt: new Date(balance.updatedAt || balance.createdAt || Date.now()).toISOString(),
        }
      : null,
    events: eventDocuments.map((event) => ({
      id: event._id.toString(),
      type: event.type,
      status: event.status,
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : null,
    })),
  };
};

const getTransferOperationById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const operation = await TransferOperation.findById(id).lean();
  if (!operation) {
    return null;
  }

  const contactIds = Array.isArray(operation.distributionLines)
    ? operation.distributionLines
        .map((line) => line.contact)
        .filter((contactId) => mongoose.Types.ObjectId.isValid(contactId))
    : [];

  const contacts = contactIds.length
    ? await Client.find({ _id: { $in: contactIds } }).lean()
    : [];

  return formatTransferOperation(operation, contacts);
};

const listTransferOperations = async ({ limit = 20, skip = 0, search = '' } = {}) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const sanitizedSkip = Math.max(Number(skip) || 0, 0);
  const searchTerm = typeof search === 'string' ? search.trim() : '';
  const regex = searchTerm ? new RegExp(escapeRegex(searchTerm), 'i') : null;

  const pipeline = [
    {
      $lookup: {
        from: 'clients',
        localField: 'distributionLines.contact',
        foreignField: '_id',
        as: 'contacts',
      },
    },
  ];

  if (regex) {
    const orFilters = [
      { operationCode: regex },
      { status: regex },
      { movementType: regex },
      { currency: regex },
      { direction: regex },
      { 'contacts.fullName': regex },
      { 'contacts.shortName': regex },
    ];

    if (mongoose.Types.ObjectId.isValid(searchTerm)) {
      orFilters.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
    }

    pipeline.push({
      $match: {
        $or: orFilters,
      },
    });
  }

  pipeline.push({
    $sort: { confirmedAt: -1, createdAt: -1 },
  });

  if (sanitizedSkip) {
    pipeline.push({ $skip: sanitizedSkip });
  }

  pipeline.push({ $limit: sanitizedLimit });

  pipeline.push({
    $project: {
      operationCode: 1,
      movementType: 1,
      direction: 1,
      currency: 1,
      totalAmount: 1,
      distributionLines: 1,
      status: 1,
      confirmedAt: 1,
      createdAt: 1,
      updatedAt: 1,
      contacts: 1,
    },
  });

  const operations = await TransferOperation.aggregate(pipeline);

  return operations.map((operation) => {
    const contacts = Array.isArray(operation.contacts) ? operation.contacts : [];
    const { contacts: _ignored, ...rest } = operation;
    return formatTransferOperation(rest, contacts);
  });
};

module.exports = {
  roundAmount,
  formatTransferOperation,
  generateTransferOperationCode,
  registerTransferOperation,
  getTransferOperationById,
  listTransferOperations,
};
