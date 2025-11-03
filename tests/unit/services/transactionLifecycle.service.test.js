const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Transaction = require('../../../src/models/Transaction');
const {
  recordTransactionSettlement,
  revertTransactionSettlement,
} = require('../../../src/services/transactionLifecycle.service');

const createStubTransaction = (overrides = {}) => {
  const userId =
    overrides.user instanceof mongoose.Types.ObjectId
      ? overrides.user
      : new mongoose.Types.ObjectId();
  const clientId =
    overrides.client instanceof mongoose.Types.ObjectId
      ? overrides.client
      : new mongoose.Types.ObjectId();

  const base = {
    _id: overrides._id || new mongoose.Types.ObjectId(),
    user: userId,
    client: clientId,
    type: 'buy',
    incomingAsset: { code: 'USD', label: 'Dólar estadounidense' },
    outgoingAsset: { code: 'ARS', label: 'Peso argentino' },
    apr: 100,
    marketApr: 100,
    incomingAmount: 100,
    outgoingAmount: 10000,
    marginPercentage: 0,
    notes: null,
    status: 'registered',
    currentStep: 3,
    settlement: {
      mode: 'simple',
      simpleMethod: 'Transferencia Banco Nación',
      lines: [],
      totalPercentage: 100,
      isComplete: true,
    },
    accountingAudit: [],
    createdBy: userId,
    lastUpdatedBy: userId,
    completedAt: null,
    ...overrides,
  };

  base.accountingAudit = Array.isArray(base.accountingAudit)
    ? base.accountingAudit.map((entry) => ({ ...entry, metadata: { ...(entry.metadata || {}) } }))
    : [];

  base.save = async () => base;

  return base;
};

const stubFindById = (t, transaction) => {
  t.mock.method(Transaction, 'findById', () => ({
    session: () => transaction,
  }));
};

test('recordTransactionSettlement marks transaction as completed with audit trail', async (t) => {
  const transaction = createStubTransaction();
  stubFindById(t, transaction);

  const movementId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const amount = 10000;

  const updated = await recordTransactionSettlement(
    transaction._id,
    {
      movementId,
      amount,
      currency: 'ARS',
      direction: 'incoming',
      movementType: 'transfers',
      source: 'unit-test',
    },
    { userId }
  );

  assert.equal(updated.status, 'completed');
  assert.ok(updated.completedAt instanceof Date);
  assert.equal(updated.lastUpdatedBy?.toString(), userId.toString());
  assert.equal(updated.accountingAudit.length, 1);
  assert.equal(updated.accountingAudit[0].action, 'settlement_completed');
  assert.equal(updated.accountingAudit[0].metadata.movementId, movementId.toString());
  assert.equal(updated.accountingAudit[0].metadata.amount, amount);
});

test('recordTransactionSettlement updates existing audit entry for duplicate movement', async (t) => {
  const movementId = new mongoose.Types.ObjectId();
  const transaction = createStubTransaction({
    status: 'completed',
    completedAt: new Date(Date.now() - 1000),
    accountingAudit: [
      {
        action: 'settlement_completed',
        performedAt: new Date(Date.now() - 2000),
        performedBy: new mongoose.Types.ObjectId(),
        metadata: {
          movementId: movementId.toString(),
          amount: 5000,
          currency: 'ARS',
          direction: 'incoming',
          movementType: 'transfers',
        },
      },
    ],
  });

  stubFindById(t, transaction);

  const userId = new mongoose.Types.ObjectId();

  const updated = await recordTransactionSettlement(
    transaction._id,
    {
      movementId,
      amount: 7500,
      currency: 'ARS',
      direction: 'incoming',
      movementType: 'transfers',
      source: 'unit-test',
    },
    { userId }
  );

  assert.equal(updated.accountingAudit.length, 1);
  const [entry] = updated.accountingAudit;
  assert.equal(entry.metadata.movementId, movementId.toString());
  assert.equal(entry.metadata.amount, 7500);
  assert.equal(updated.lastUpdatedBy?.toString(), userId.toString());
});

test('revertTransactionSettlement removes audit entry and returns to registered', async (t) => {
  const movementId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  const transaction = createStubTransaction({
    status: 'completed',
    completedAt: new Date(),
    accountingAudit: [
      {
        action: 'settlement_completed',
        performedAt: new Date(),
        performedBy: userId,
        metadata: {
          movementId: movementId.toString(),
        },
      },
    ],
    lastUpdatedBy: userId,
  });

  stubFindById(t, transaction);

  const updated = await revertTransactionSettlement(transaction._id, movementId, { userId });

  assert.equal(updated.status, 'registered');
  assert.equal(updated.completedAt, null);
  assert.equal(
    updated.accountingAudit.some((entry) => entry.action === 'settlement_completed'),
    false
  );
  const revertEntry = updated.accountingAudit.find(
    (entry) => entry.action === 'settlement_reverted'
  );
  assert.ok(revertEntry);
  assert.equal(revertEntry.metadata.movementId, movementId.toString());
  assert.equal(updated.lastUpdatedBy?.toString(), userId.toString());
});
