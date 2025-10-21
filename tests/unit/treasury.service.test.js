const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Client = require('../../src/models/Client');
const Transaction = require('../../src/models/Transaction');
const TreasuryBalance = require('../../src/models/TreasuryBalance');
const CurrentAccountBalance = require('../../src/models/CurrentAccountBalance');
const ContactBalance = require('../../src/models/ContactBalance');
const {
  registerTreasuryMovement,
  listTreasuryMovements,
  cancelTreasuryMovement,
  compensateTreasuryMovement,
} = require('../../src/services/treasury.service');
const { applyTransactionRegistration } = require('../../src/services/currentAccount.service');

let mongo;
const MONGO_VERSION = process.env.MONGOMS_VERSION || '7.0.4';

before(async () => {
  mongo = await MongoMemoryReplSet.create({
    binary: {
      version: MONGO_VERSION,
    },
    replSet: {
      storageEngine: 'wiredTiger',
    },
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri, { dbName: 'finatech_test' });
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

test('registerTreasuryMovement updates balances and contact accounts for incoming cash', async () => {
  const client = await Client.create({
    firstName: 'Ana',
    lastName: 'Paredes',
    fullName: 'Ana Paredes',
    internalOwner: 'owner-1',
    contactType: 'client',
    status: 'active',
  });

  const result = await registerTreasuryMovement(
    {
      type: 'incoming',
      medium: 'cash',
      currency: 'ARS',
      amount: 1500,
      contactId: client._id.toString(),
      description: 'Cobro en efectivo',
    },
    {}
  );

  assert.ok(result.movement);
  assert.equal(result.movement.type, 'incoming');
  assert.equal(result.movement.medium, 'cash');
  assert.equal(result.movement.currency, 'ARS');
  assert.equal(result.movement.amount, 1500);
  assert.equal(result.movement.status, 'registered');
  assert.equal(result.movement.contact.id, client._id.toString());

  const balance = await TreasuryBalance.findOne({ key: 'cash', currency: 'ARS' }).lean();
  assert(balance);
  assert.equal(balance.amount, 1500);

  const generalAccount = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'ARS',
  }).lean();
  assert(generalAccount);
  assert.equal(generalAccount.amount, -1500);

  const contactBalance = await ContactBalance.findOne({
    contact: client._id,
    currency: 'ARS',
  }).lean();
  assert(contactBalance);
  assert.equal(contactBalance.amount, -1500);
});

test('registerTreasuryMovement compensates registered transaction and zeroes receivables', async () => {
  const client = await Client.create({
    firstName: 'Lucas',
    lastName: 'Molina',
    fullName: 'Lucas Molina',
    internalOwner: 'owner-2',
    contactType: 'client',
    status: 'active',
  });

  const transaction = await Transaction.create({
    client: client._id,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'Dólar' },
    outgoingAsset: { code: 'ARS', label: 'Pesos' },
    subtype: 'spot',
    apr: 1,
    marketApr: 1,
    incomingAmount: 1250,
    outgoingAmount: 400000,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'transfer',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  await applyTransactionRegistration(transaction, {});

  const receivableBefore = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'USD',
  }).lean();
  assert(receivableBefore);
  assert.equal(receivableBefore.amount, 1250);

  const { movement } = await registerTreasuryMovement(
    {
      type: 'incoming',
      medium: 'cash',
      currency: 'USD',
      amount: 1250,
      operation: {
        type: 'transaction',
        id: transaction._id.toString(),
      },
    },
    {}
  );

  assert.equal(movement.status, 'compensated');
  assert.equal(movement.contact.id, client._id.toString());
  assert.equal(movement.linkedOperations.length, 1);
  assert.equal(movement.linkedOperations[0].model, 'Transaction');

  const receivableAfter = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'USD',
  }).lean();
  assert(receivableAfter);
  assert.equal(receivableAfter.amount, 0);
});

test('cancelTreasuryMovement reverts balances and flags movement', async () => {
  const client = await Client.create({
    firstName: 'Marcos',
    lastName: 'Silva',
    fullName: 'Marcos Silva',
    internalOwner: 'owner-3',
    contactType: 'client',
    status: 'active',
  });

  const { movement } = await registerTreasuryMovement(
    {
      type: 'incoming',
      medium: 'cash',
      currency: 'ARS',
      amount: 2000,
      contactId: client._id.toString(),
      description: 'Ingreso temporal',
    },
    {}
  );

  const balanceBefore = await TreasuryBalance.findOne({ key: 'cash', currency: 'ARS' }).lean();
  assert.equal(balanceBefore.amount, 2000);

  const cancelled = await cancelTreasuryMovement(
    movement.id,
    { reason: 'Error en carga' },
    {}
  );

  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.cancellationReason, 'Error en carga');

  const balanceAfter = await TreasuryBalance.findOne({ key: 'cash', currency: 'ARS' }).lean();
  assert(balanceAfter);
  assert.equal(balanceAfter.amount, 0);

  const receivableAfter = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'ARS',
  }).lean();
  assert(receivableAfter);
  assert.equal(receivableAfter.amount, 0);

  const contactBalance = await ContactBalance.findOne({
    contact: client._id,
    currency: 'ARS',
  }).lean();
  assert(contactBalance);
  assert.equal(contactBalance.amount, 0);
});

test('listTreasuryMovements supports filtering and pagination', async () => {
  const client = await Client.create({
    firstName: 'Lucía',
    lastName: 'Giménez',
    fullName: 'Lucía Giménez',
    internalOwner: 'owner-4',
    contactType: 'client',
    status: 'active',
  });

  await registerTreasuryMovement(
    {
      type: 'incoming',
      medium: 'cash',
      currency: 'ARS',
      amount: 750,
      contactId: client._id.toString(),
      description: 'Cobro parcial',
    },
    {}
  );

  await registerTreasuryMovement(
    {
      type: 'outgoing',
      medium: 'transfer',
      currency: 'ARS',
      amount: 500,
      description: 'Pago a proveedor',
    },
    {}
  );

  const list = await listTreasuryMovements({
    page: 1,
    limit: 10,
    filters: {
      currency: 'ARS',
    },
  });

  assert.equal(list.pagination.totalItems, 2);
  assert.equal(list.items.length, 2);
  assert(list.totals.ARS);
  assert.equal(list.totals.ARS.incoming, 750);
  assert.equal(list.totals.ARS.outgoing, 500);
  assert.equal(list.totals.ARS.net, 250);
});

test('compensateTreasuryMovement links new operation to existing record', async () => {
  const client = await Client.create({
    firstName: 'Paula',
    lastName: 'Rey',
    fullName: 'Paula Rey',
    internalOwner: 'owner-5',
    contactType: 'client',
    status: 'active',
  });

  const transaction = await Transaction.create({
    client: client._id,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'Dólar' },
    outgoingAsset: { code: 'ARS', label: 'Pesos' },
    subtype: 'spot',
    apr: 1,
    marketApr: 1,
    incomingAmount: 500,
    outgoingAmount: 200000,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'transfer',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  await applyTransactionRegistration(transaction, {});

  const { movement } = await registerTreasuryMovement(
    {
      type: 'incoming',
      medium: 'cash',
      currency: 'USD',
      amount: 500,
      contactId: client._id.toString(),
      description: 'Cobro sin operación vinculada',
    },
    {}
  );

  const compensated = await compensateTreasuryMovement(
    movement.id,
    {
      operation: {
        type: 'transaction',
        id: transaction._id.toString(),
      },
    },
    {}
  );

  assert.equal(compensated.status, 'compensated');
  assert.equal(compensated.linkedOperations.length, 1);
  assert.equal(compensated.linkedOperations[0].id, transaction._id.toString());
});
