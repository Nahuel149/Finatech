const test = require('node:test');
const assert = require('node:assert/strict');

let resolveSettlementSlices;
let mapSettlementMethodToMovementType;

try {
  const {
    __testHelpers,
  } = require('../../../src/services/transaction.service');
  resolveSettlementSlices = __testHelpers.resolveSettlementSlices;
  mapSettlementMethodToMovementType = __testHelpers.mapSettlementMethodToMovementType;
} catch (error) {
  console.error('Failed to load transaction.service helpers:', error);
  throw error;
}

test('resolveSettlementSlices returns single slice for simple settlement', () => {
  const transaction = {
    settlement: {
      mode: 'simple',
      simpleMethod: 'Transferencia Banco Nación',
    },
  };

  const slices = resolveSettlementSlices(transaction, 1000);

  assert.deepEqual(slices, [
    {
      method: 'Transferencia Banco Nación',
      movementType: 'transfer',
      amount: 1000,
    },
  ]);
});

test('resolveSettlementSlices maps compound amount allocations', () => {
  const transaction = {
    settlement: {
      mode: 'compound',
      lines: [
        {
          method: 'Efectivo sucursal',
          allocationType: 'amount',
          value: 350,
        },
        {
          method: 'Transferencia BBVA',
          allocationType: 'amount',
          value: 650,
        },
      ],
    },
  };

  const slices = resolveSettlementSlices(transaction, 1000);

  assert.deepEqual(slices, [
    {
      method: 'Efectivo sucursal',
      movementType: 'cash',
      amount: 350,
    },
    {
      method: 'Transferencia BBVA',
      movementType: 'transfer',
      amount: 650,
    },
  ]);
});

test('resolveSettlementSlices balances percentage allocations with rounding', () => {
  const transaction = {
    settlement: {
      mode: 'compound',
      lines: [
        {
          method: 'Efectivo USD',
          allocationType: 'percentage',
          value: 33.3333,
          computedPercentage: 33.3333,
        },
        {
          method: 'Depósito Banco Galicia',
          allocationType: 'percentage',
          value: 66.6667,
          computedPercentage: 66.6667,
        },
      ],
    },
  };

  const slices = resolveSettlementSlices(transaction, 1500);

  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  assert.equal(total, 1500);
  assert.equal(slices[0].movementType, 'usd');
  assert.equal(slices[1].movementType, 'transfer');
});

test('resolveSettlementSlices throws when allocations do not match total', () => {
  const transaction = {
    settlement: {
      mode: 'compound',
      lines: [
        {
          method: 'Efectivo',
          allocationType: 'percentage',
          value: 80,
        },
        {
          method: 'Transferencia',
          allocationType: 'percentage',
          value: 10,
        },
      ],
    },
  };

  assert.throws(
    () => resolveSettlementSlices(transaction, 1000),
    /La liquidación no coincide/
  );
});

test('mapSettlementMethodToMovementType detects keywords', () => {
  assert.equal(mapSettlementMethodToMovementType('Caja USD Central'), 'usd');
  assert.equal(mapSettlementMethodToMovementType('Efectivo sucursal'), 'cash');
  assert.equal(mapSettlementMethodToMovementType('Depósito en banco'), 'transfer');
});
