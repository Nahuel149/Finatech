const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Session = require('../../src/models/Session');
const LogisticsOperation = require('../../src/models/LogisticsOperation');
const { hashToken } = require('../../src/utils/token');

let mongoServer;
let server;
let baseUrl;

const jsonRequest = async ({ method, path, body, cookie, csrfToken }) => {
  const headers = {};
  if (cookie) {
    headers.Cookie = cookie;
  }
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  return { response, payload };
};

const createAuthContext = async (permissions) => {
  const suffix = crypto.randomUUID();
  const user = await User.create({
    fullName: `Test User ${suffix}`,
    email: `test-${suffix}@example.com`,
    isVerified: true,
    providers: [{ provider: 'local' }],
    permissions,
  });

  const sessionToken = `session-${crypto.randomUUID()}`;
  await Session.create({
    user: user._id,
    tokenHash: hashToken(sessionToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    rememberMe: false,
  });

  const csrfToken = `csrf-${crypto.randomUUID()}`;
  const cookie = `finatech_session=${sessionToken}; finatech_csrf=${csrfToken}`;

  return {
    userId: user._id.toString(),
    cookie,
    csrfToken,
  };
};

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'finatech-unit',
  });

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await mongoose.disconnect();
  await mongoServer.stop();
});

test.beforeEach(async () => {
  await Promise.all([
    LogisticsOperation.deleteMany({}),
    Session.deleteMany({}),
    User.deleteMany({}),
  ]);
});

test('rejects logistics create when user lacks manage-logistics permission', async () => {
  const auth = await createAuthContext(['access-logistics']);

  const { response, payload } = await jsonRequest({
    method: 'POST',
    path: '/api/logistics/operations',
    body: {
      operationCode: `OP-${Date.now()}`,
      type: 'Entrega',
      scheduledAt: new Date().toISOString(),
    },
    cookie: auth.cookie,
    csrfToken: auth.csrfToken,
  });

  assert.equal(response.status, 403);
  assert.match(
    payload?.message || '',
    /permisos suficientes/i,
  );
});

test('rejects logistics reads when user lacks logistics permissions', async () => {
  const auth = await createAuthContext(['view-balances']);

  const { response, payload } = await jsonRequest({
    method: 'GET',
    path: '/api/logistics/operations',
    cookie: auth.cookie,
  });

  assert.equal(response.status, 403);
  assert.match(
    payload?.message || '',
    /permisos suficientes/i,
  );
});

test('allows logistics reads with access-logistics permission', async () => {
  const auth = await createAuthContext(['access-logistics']);

  const { response, payload } = await jsonRequest({
    method: 'GET',
    path: '/api/logistics/operations',
    cookie: auth.cookie,
  });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload?.data));
});

test('returns metadata note after logistics update round-trip', async () => {
  const auth = await createAuthContext(['manage-logistics']);
  const operationCode = `OP-${Date.now()}-${Math.round(Math.random() * 1000)}`;

  const created = await jsonRequest({
    method: 'POST',
    path: '/api/logistics/operations',
    body: {
      operationCode,
      type: 'Entrega',
      scheduledAt: new Date().toISOString(),
      contactName: 'Cliente Test',
      responsibleName: 'Operador Test',
    },
    cookie: auth.cookie,
    csrfToken: auth.csrfToken,
  });

  assert.equal(created.response.status, 201);
  const operationId = created.payload?.id;
  assert.ok(operationId);

  const note = 'Nota persistida para validar metadata en DTO.';
  const updated = await jsonRequest({
    method: 'PATCH',
    path: `/api/logistics/operations/${operationId}`,
    body: { notes: note },
    cookie: auth.cookie,
    csrfToken: auth.csrfToken,
  });

  assert.equal(updated.response.status, 200);
  assert.equal(updated.payload?.metadata?.note, note);

  const fetched = await jsonRequest({
    method: 'GET',
    path: `/api/logistics/operations/${operationId}`,
    cookie: auth.cookie,
  });

  assert.equal(fetched.response.status, 200);
  assert.equal(fetched.payload?.metadata?.note, note);
});
