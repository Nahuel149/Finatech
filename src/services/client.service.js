const mongoose = require('mongoose');
const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const TreasuryMovement = require('../models/TreasuryMovement');
const TransferOperation = require('../models/TransferOperation');
const { ensureContactBalance } = require('./currentAccount.service');
const { logger } = require('../utils/logger');

const MOCK_SAMPLE_CUITS = [
  '20-12345678-9',
  '20-98765432-1',
  '20-11223344-5',
  '20-55667788-9',
  '20-99887766-4',
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toTitleCase = (value) =>
  value
    ? value
        .split(' ')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
    : '';

const normalizeAddressInput = (address) => {
  if (!address || typeof address !== 'object') {
    return null;
  }

  const formatted = address.formatted || address.description || address.raw?.description || null;

  if (!formatted) {
    return null;
  }

  return {
    formatted,
    description: address.description || formatted,
    placeId: address.placeId || null,
    latitude: Number.isFinite(address.latitude) ? address.latitude : null,
    longitude: Number.isFinite(address.longitude) ? address.longitude : null,
    raw: address.raw || null,
  };
};

const formatClient = (client) => {
  if (!client) {
    return null;
  }

  const fullName =
    client.fullName ||
    [client.firstName, client.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  return {
    id: client._id.toString(),
    firstName: client.firstName || fullName,
    lastName: client.lastName || '',
    fullName,
    shortName: client.shortName || fullName,
    cuit: client.cuit || null,
    contactType: client.contactType || 'client',
    internalOwner: client.internalOwner || null,
    lastMarginPercentage: client.lastMarginPercentage,
    email: client.email || null,
    phone: client.phone || null,
    primaryAddress: client.primaryAddress || null,
    secondaryAddress: client.secondaryAddress || null,
    createdAt: client.createdAt,
  };
};

const searchClients = async ({ query, limit = 10 } = {}) => {
  const filter = {
    status: 'active',
    cuit: { $nin: MOCK_SAMPLE_CUITS },
  };

  if (query) {
    const pattern = new RegExp(escapeRegex(query), 'i');
    filter.$or = [
      { fullName: pattern },
      { shortName: pattern },
      { cuit: pattern },
      { firstName: pattern },
      { lastName: pattern },
    ];
  }

  const clients = await Client.find(filter).sort({ fullName: 1 }).limit(limit).lean();

  const missingMarginIds = clients
    .filter((client) => !Number.isFinite(Number(client.lastMarginPercentage)))
    .map((client) => client._id);

  let latestMarginsByClient = {};
  if (missingMarginIds.length > 0) {
    const latestMargins = await Transaction.aggregate([
      {
        $match: {
          client: { $in: missingMarginIds },
          status: 'registered',
          marginPercentage: { $ne: null },
        },
      },
      {
        $sort: { completedAt: -1, updatedAt: -1, createdAt: -1 },
      },
      {
        $group: {
          _id: '$client',
          lastMarginPercentage: { $first: '$marginPercentage' },
        },
      },
    ]);

    latestMarginsByClient = latestMargins.reduce((acc, item) => {
      acc[item._id.toString()] = item.lastMarginPercentage;
      return acc;
    }, {});
  }

  return clients.map((client) => {
    const formatted = formatClient(client);
    if (!Number.isFinite(Number(formatted.lastMarginPercentage))) {
      const fallbackMargin = latestMarginsByClient[client._id.toString()];
      if (Number.isFinite(Number(fallbackMargin))) {
        formatted.lastMarginPercentage = Number(fallbackMargin);
      }
    }
    return formatted;
  });
};

const getClientById = async (id) => {
  const client = await Client.findById(id).lean();
  if (!client) {
    return null;
  }

  let lastMargin = client.lastMarginPercentage;
  if (!Number.isFinite(Number(lastMargin))) {
    const lastTransaction = await Transaction.findOne({
      client: client._id,
      status: 'registered',
      marginPercentage: { $ne: null },
    })
      .sort({ completedAt: -1, updatedAt: -1, createdAt: -1 })
      .lean();

    if (lastTransaction && Number.isFinite(Number(lastTransaction.marginPercentage))) {
      lastMargin = Number(lastTransaction.marginPercentage);
    }
  }

  const formatted = formatClient(client);
  formatted.lastMarginPercentage = Number.isFinite(Number(lastMargin)) ? Number(lastMargin) : null;
  return formatted;
};

const updateClient = async (id, payload) => {
  const client = await Client.findById(id);
  if (!client) {
    const error = new Error('Cliente no encontrado');
    error.status = 404;
    throw error;
  }

  const normalizedContactType = payload.contactType === 'provider' ? 'provider' : 'client';

  client.firstName = toTitleCase(payload.firstName || client.firstName);
  client.lastName = toTitleCase(payload.lastName || client.lastName);
  client.internalOwner = toTitleCase(payload.internalOwner || client.internalOwner);
  client.contactType = normalizedContactType;

  client.primaryAddress = normalizeAddressInput(payload.primaryAddress) || client.primaryAddress;
  client.secondaryAddress = normalizeAddressInput(payload.secondaryAddress) || client.secondaryAddress;

  client.cuit = payload.cuit && String(payload.cuit).trim() ? String(payload.cuit).trim() : client.cuit;
  client.email =
    payload.email && String(payload.email).trim() ? String(payload.email).trim() : client.email;
  client.phone =
    payload.phone && String(payload.phone).trim() ? String(payload.phone).trim() : client.phone;

  await client.validate();
  await client.save();

  return formatClient(client.toObject());
};

const createClient = async (payload) => {
  const normalizedContactType = payload.contactType === 'provider' ? 'provider' : 'client';

  const document = new Client({
    firstName: toTitleCase(payload.firstName),
    lastName: toTitleCase(payload.lastName),
    internalOwner: toTitleCase(payload.internalOwner),
    contactType: normalizedContactType,
    lastMarginPercentage: null,
    primaryAddress: normalizeAddressInput(payload.primaryAddress),
    secondaryAddress: normalizeAddressInput(payload.secondaryAddress),
  });

  if (payload.cuit && String(payload.cuit).trim()) {
    document.cuit = String(payload.cuit).trim();
  }
  if (payload.email && String(payload.email).trim()) {
    document.email = String(payload.email).trim();
  }
  if (payload.phone && String(payload.phone).trim()) {
    document.phone = String(payload.phone).trim();
  }

  await document.validate();
  await document.save();

  try {
    await Promise.all([
      ensureContactBalance(document._id, 'ARS'),
      ensureContactBalance(document._id, 'USD'),
    ]);
  } catch (balanceError) {
    // eslint-disable-next-line no-console
    logger.error('client_balance_init_failed', {
      clientId: document?._id ? document._id.toString() : null,
      message: balanceError.message,
    });
  }

  return formatClient(document.toObject());
};

const getRecentClients = async ({ limit = 8 } = {}) => {
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 8, 1), 30);
  const recentById = new Map();

  const recentMovements = await TreasuryMovement.aggregate([
    { $match: { contact: { $ne: null } } },
    { $sort: { movementAt: -1, createdAt: -1 } },
    {
      $project: {
        contact: 1,
        lastUsedAt: { $ifNull: ['$movementAt', '$createdAt'] },
      },
    },
    {
      $group: {
        _id: '$contact',
        lastUsedAt: { $first: '$lastUsedAt' },
      },
    },
    { $limit: sanitizedLimit * 3 },
  ]);

  recentMovements.forEach((entry) => {
    if (entry?._id && mongoose.Types.ObjectId.isValid(entry._id)) {
      recentById.set(entry._id.toString(), new Date(entry.lastUsedAt || Date.now()));
    }
  });

  const recentTransfers = await TransferOperation.aggregate([
    { $unwind: '$distributionLines' },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$distributionLines.contact',
        lastUsedAt: { $first: '$createdAt' },
      },
    },
    { $limit: sanitizedLimit * 3 },
  ]);

  recentTransfers.forEach((entry) => {
    if (entry?._id && mongoose.Types.ObjectId.isValid(entry._id)) {
      const date = new Date(entry.lastUsedAt || Date.now());
      const key = entry._id.toString();
      const current = recentById.get(key);
      if (!current || date > current) {
        recentById.set(key, date);
      }
    }
  });

  const baseFilter = {
    status: 'active',
    cuit: { $nin: MOCK_SAMPLE_CUITS },
  };

  const latestClients = await Client.find(baseFilter)
    .sort({ createdAt: -1 })
    .limit(sanitizedLimit * 2)
    .lean();

  latestClients.forEach((client) => {
    const id = client?._id?.toString();
    if (!id) return;
    const createdAt = client.createdAt ? new Date(client.createdAt) : new Date();
    const current = recentById.get(id);
    if (!current || createdAt > current) {
      recentById.set(id, createdAt);
    }
  });

  const uniqueIds = Array.from(
    new Set([...recentById.keys(), ...latestClients.map((client) => client._id.toString())])
  );

  if (!uniqueIds.length) {
    return [];
  }

  const clients = await Client.find({ _id: { $in: uniqueIds } }).lean();
  const formatted = clients.map((client) => formatClient(client));

  const ranked = formatted
    .map((client) => ({
      client,
      lastUsedAt: recentById.get(client.id) || (client.createdAt ? new Date(client.createdAt) : new Date(0)),
    }))
    .sort((a, b) => {
      const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return bTime - aTime;
    });

  const seen = new Set();
  const deduped = ranked.filter((entry) => {
    if (seen.has(entry.client.id)) return false;
    seen.add(entry.client.id);
    return true;
  });

  return deduped.slice(0, sanitizedLimit).map((entry) => entry.client);
};

module.exports = {
  searchClients,
  getClientById,
  createClient,
  updateClient,
  getRecentClients,
};
