const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractCurrencyAndAmountFromTransaction,
} = require('../../../src/services/currentAccount.service');

const buildTransaction = (overrides = {}) => ({
  type: 'buy',
  incomingAsset: { code: 'USD', label: 'Dólar estadounidense' },
  outgoingAsset: { code: 'ARS', label: 'Peso argentino' },
  incomingAmount: 125,
  outgoingAmount: 112500,
  ...overrides,
});

test('extractCurrencyAndAmountFromTransaction prioritises incoming non-ARS asset for buy', () => {
  const transaction = buildTransaction();

  const result = extractCurrencyAndAmountFromTransaction(transaction);

  assert.deepEqual(result, { currency: 'USD', amount: 125 });
});

test('extractCurrencyAndAmountFromTransaction prioritises outgoing non-ARS asset for sell', () => {
  const transaction = buildTransaction({
    type: 'sell',
    incomingAsset: { code: 'ARS', label: 'Peso argentino' },
    incomingAmount: 112500,
    outgoingAsset: { code: 'USD', label: 'Dólar estadounidense' },
    outgoingAmount: 125,
  });

  const result = extractCurrencyAndAmountFromTransaction(transaction);

  assert.deepEqual(result, { currency: 'USD', amount: 125 });
});

test('extractCurrencyAndAmountFromTransaction falls back to ARS when no other asset is available', () => {
  const transaction = buildTransaction({
    type: 'settlement',
    incomingAsset: { code: 'ARS', label: 'Peso argentino' },
    outgoingAsset: { code: 'ARS', label: 'Peso argentino' },
    incomingAmount: 5000,
    outgoingAmount: 3000,
  });

  const result = extractCurrencyAndAmountFromTransaction(transaction);

  assert.deepEqual(result, { currency: 'ARS', amount: 5000 });
});
