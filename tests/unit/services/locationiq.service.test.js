const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const { geocodeAddress } = require('../../../src/services/locationiq.service');

const originalKey = process.env.LOCATIONIQ_API_KEY;

test.after(() => {
  process.env.LOCATIONIQ_API_KEY = originalKey;
});

test('geocodeAddress throws when API key is missing', async () => {
  process.env.LOCATIONIQ_API_KEY = '';

  await assert.rejects(
    () => geocodeAddress('Obelisco'),
    /LocationIQ no está configurado/
  );
});

test('geocodeAddress proxies request to LocationIQ and normalizes response', async (t) => {
  process.env.LOCATIONIQ_API_KEY = 'dummy-key';

  const fakeData = [
    {
      display_name: 'Av. Corrientes 1234, Buenos Aires',
      lat: '-34.603722',
      lon: '-58.381592',
      type: 'address',
      address: { city: 'Buenos Aires' },
    },
  ];

  const getMock = t.mock.method(axios, 'get', async (url, { params }) => {
    assert.match(url, /locationiq\.com/);
    assert.equal(params.key, 'dummy-key');
    assert.equal(params.countrycodes, 'ar');
    assert.equal(params.limit, 3);
    return { data: fakeData };
  });

  const results = await geocodeAddress('Corrientes 1234', { countrycodes: 'ar', limit: 3 });

  assert.equal(getMock.mock.callCount(), 1);
  assert.deepEqual(results, [
    {
      displayName: 'Av. Corrientes 1234, Buenos Aires',
      lat: -34.603722,
      lon: -58.381592,
      type: 'address',
      address: { city: 'Buenos Aires' },
    },
  ]);
});

test('geocodeAddress surfaces upstream errors with status', async (t) => {
  process.env.LOCATIONIQ_API_KEY = 'dummy-key';

  t.mock.method(axios, 'get', async () => {
    const error = new Error('Upstream unavailable');
    error.response = { status: 503, data: { error: 'Service down' } };
    throw error;
  });

  await assert.rejects(
    () => geocodeAddress('Corrientes'),
    (error) => {
      assert.equal(error.status, 503);
      assert.match(error.message, /Service down/);
      return true;
    }
  );
});
