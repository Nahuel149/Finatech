const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const Client = require('../../src/models/Client');
const Transaction = require('../../src/models/Transaction');
const CurrentAccountBalance = require('../../src/models/CurrentAccountBalance');
const ContactBalance = require('../../src/models/ContactBalance');
const CurrentAccountMovement = require('../../src/models/CurrentAccountMovement');
const {
  applyTransactionRegistration,
  applyTreasurySettlement,
  getCurrentAccountSummary,
  listCurrentAccountMovements,
  listContactBalancesDetailed,
  getContactBalanceDetail,
} = require('../../src/services/currentAccount.service');

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

test('applies transaction registration updating balances and movements', async () => {
  const client = await Client.create({
    firstName: 'María',
    lastName: 'Gómez',
    fullName: 'María Gómez',
    internalOwner: 'owner-1',
    contactType: 'client',
    status: 'active',
  });

  const transaction = await Transaction.create({
    client: client._id,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'Dólar' },
    outgoingAsset: { code: 'ARS', label: 'Peso' },
    subtype: 'spot',
    apr: 1,
    marketApr: 1,
    incomingAmount: 1250,
    outgoingAmount: 1000000,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'cash',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  await applyTransactionRegistration(transaction, {});

  const summary = await getCurrentAccountSummary();
  assert.equal(summary.totalsByCurrency.USD, 1250);

  const accountBalance = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'USD',
  }).lean();
  assert(accountBalance);
  assert.equal(accountBalance.amount, 1250);

  const contactBalance = await ContactBalance.findOne({
    contact: client._id,
    currency: 'USD',
  }).lean();
  assert(contactBalance);
  assert.equal(contactBalance.amount, 1250);

  const movements = await listCurrentAccountMovements({ currency: 'USD' });
  assert.equal(movements.total, 2);
  const ledgers = new Set(movements.items.map((item) => item.ledger));
  assert(ledgers.has('general'));
  assert(ledgers.has('contact'));
});

test('applies treasury settlement adjusting receivables and contact balances', async () => {
  const client = await Client.create({
    firstName: 'Carlos',
    lastName: 'Mendoza',
    fullName: 'Carlos Mendoza',
    internalOwner: 'owner-2',
    contactType: 'client',
    status: 'active',
  });

  const operation = {
    _id: new mongoose.Types.ObjectId(),
    movementType: 'cash',
    direction: 'incoming',
    currency: 'ARS',
    totalAmount: 500,
    distributionLines: [
      {
        contact: client._id,
        amount: 500,
      },
    ],
  };

  await applyTreasurySettlement(operation, {});

  const accountBalance = await CurrentAccountBalance.findOne({
    accountKey: 'accounts_receivable',
    currency: 'ARS',
  }).lean();
  assert(accountBalance);
  assert.equal(accountBalance.amount, -500);

  const contactBalance = await ContactBalance.findOne({
    contact: client._id,
    currency: 'ARS',
  }).lean();
  assert(contactBalance);
  assert.equal(contactBalance.amount, -500);

  const movements = await CurrentAccountMovement.find({ currency: 'ARS' })
    .sort({ createdAt: -1 })
    .lean();
  assert.equal(movements.length, 2);
  movements.forEach((movement) => {
    assert.equal(movement.stage, 'settlement');
  });
});

test('lists contact balances with last operation metadata', async () => {
  const clientA = await Client.create({
    firstName: 'Lucía',
    lastName: 'Pérez',
    fullName: 'Lucía Pérez',
    internalOwner: 'owner-3',
    contactType: 'client',
    status: 'active',
  });

  const clientB = await Client.create({
    firstName: 'Proveedor',
    lastName: 'SRL',
    fullName: 'Proveedor SRL',
    internalOwner: 'owner-4',
    contactType: 'provider',
    status: 'active',
  });

  const transactionBuy = await Transaction.create({
    client: clientA._id,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'Dólar' },
    outgoingAsset: { code: 'ARS', label: 'Pesos' },
    subtype: 'spot',
    apr: 1,
    marketApr: 1,
    incomingAmount: 2000,
    outgoingAmount: 600000,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'cash',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  const transactionSell = await Transaction.create({
    client: clientB._id,
    type: 'sell',
    incomingAsset: { code: 'ARS', label: 'Pesos' },
    outgoingAsset: { code: 'USD', label: 'Dólar' },
    subtype: 'spot',
    apr: 1,
    marketApr: 1,
    incomingAmount: 500000,
    outgoingAmount: 1500,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'cash',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  await applyTransactionRegistration(transactionBuy, {});
  await applyTransactionRegistration(transactionSell, {});

  const result = await listContactBalancesDetailed({ currency: 'USD', sortBy: 'amount' });
  assert.equal(result.totalItems, 2);
  const [first, second] = result.items;
  assert.equal(first.contact.contactType, 'client');
  assert.equal(first.balanceSign, 'positive');
  assert.equal(second.contact.contactType, 'provider');
  assert.equal(second.balanceSign, 'negative');
  assert(first.lastOperation);
  assert(first.lastOperation.createdAt);
});

test('returns contact detail with operations and totals', async () => {
  const client = await Client.create({
    firstName: 'Ana',
    lastName: 'Lopez',
    fullName: 'Ana Lopez',
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
    incomingAmount: 750,
    outgoingAmount: 250000,
    marginPercentage: 0,
    settlement: {
      mode: 'simple',
      simpleMethod: 'cash',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
  });

  await applyTransactionRegistration(transaction, {});

  const detail = await getContactBalanceDetail({ contactId: client._id.toString(), currency: 'USD' });
  assert.equal(detail.contact.fullName, 'Ana Lopez');
  assert.equal(detail.selectedCurrency, 'USD');
  assert.equal(detail.totals.net, 750);
  assert.equal(detail.operations.totalItems, 1);
  const op = detail.operations.items[0];
  assert.equal(op.state, 'registrada');
  assert.equal(op.operation.type, 'compra');
});
