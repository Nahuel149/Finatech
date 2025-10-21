const Client = require('../models/Client');

const SAMPLE_CLIENTS = [
  {
    firstName: 'Cliente',
    lastName: 'Alpha',
    internalOwner: 'Ana Fernández',
    contactType: 'client',
    fullName: 'Cliente Alpha',
    shortName: 'Cliente Alpha',
    cuit: '20-12345678-9',
    email: 'alpha@example.com',
    phone: '+54 11 4567-1234',
    lastMarginPercentage: 2.5,
    primaryAddress: {
      formatted: 'Av. Corrientes 1234, CABA, Argentina',
      description: 'Av. Corrientes 1234, CABA, Argentina',
    },
  },
  {
    firstName: 'Cliente',
    lastName: 'Beta',
    internalOwner: 'Carlos Gómez',
    contactType: 'client',
    fullName: 'Cliente Beta',
    shortName: 'Cliente Beta',
    cuit: '20-98765432-1',
    email: 'beta@example.com',
    phone: '+54 11 4567-5678',
    lastMarginPercentage: 1.8,
    primaryAddress: {
      formatted: 'Av. Santa Fe 4321, CABA, Argentina',
      description: 'Av. Santa Fe 4321, CABA, Argentina',
    },
  },
  {
    firstName: 'Cliente',
    lastName: 'Gamma',
    internalOwner: 'Lucía Martínez',
    contactType: 'client',
    fullName: 'Cliente Gamma',
    shortName: 'Cliente Gamma',
    cuit: '20-11223344-5',
    email: 'gamma@example.com',
    phone: '+54 11 5555-1234',
    lastMarginPercentage: 3.2,
  },
  {
    firstName: 'Proveedor',
    lastName: 'Delta',
    internalOwner: 'Pedro López',
    contactType: 'provider',
    fullName: 'Proveedor Delta',
    shortName: 'Proveedor Delta',
    cuit: '20-55667788-9',
    email: 'delta@example.com',
    phone: '+54 11 5555-5678',
    lastMarginPercentage: -0.5,
  },
  {
    firstName: 'Proveedor',
    lastName: 'Epsilon',
    internalOwner: 'María Núñez',
    contactType: 'provider',
    fullName: 'Proveedor Epsilon',
    shortName: 'Proveedor Epsilon',
    cuit: '20-99887766-4',
    email: 'epsilon@example.com',
    phone: '+54 11 4444-1357',
    lastMarginPercentage: 2.1,
  },
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureSampleClients = async () => {
  const total = await Client.estimatedDocumentCount();
  if (total > 0) {
    return;
  }

  const operations = SAMPLE_CLIENTS.map((client) => ({
    updateOne: {
      filter: { cuit: client.cuit },
      update: { $setOnInsert: client },
      upsert: true,
    },
  }));

  await Client.bulkWrite(operations, { ordered: false });
};

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
  await ensureSampleClients();

  const filter = { status: 'active' };

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
  return clients.map(formatClient);
};

const getClientById = async (id) => {
  const client = await Client.findById(id).lean();
  return formatClient(client);
};

const createClient = async (payload) => {
  const normalizedContactType = payload.contactType === 'provider' ? 'provider' : 'client';

  const document = new Client({
    firstName: toTitleCase(payload.firstName),
    lastName: toTitleCase(payload.lastName),
    internalOwner: toTitleCase(payload.internalOwner),
    contactType: normalizedContactType,
    cuit: payload.cuit || null,
    email: payload.email || null,
    phone: payload.phone || null,
    lastMarginPercentage: null,
    primaryAddress: normalizeAddressInput(payload.primaryAddress),
    secondaryAddress: normalizeAddressInput(payload.secondaryAddress),
  });

  await document.validate();
  await document.save();

  return formatClient(document.toObject());
};

module.exports = {
  ensureSampleClients,
  searchClients,
  getClientById,
  createClient,
};
