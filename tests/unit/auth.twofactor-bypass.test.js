const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Session = require('../../src/models/Session');

let mongoServer;
let server;
let baseUrl;

const jsonRequest = async ({ method, path, body }) => {
  const headers = {};
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
    Session.deleteMany({}),
    User.deleteMany({}),
  ]);
});

test('local login requires 2FA when enabled and bypass is off', async () => {
  const original = process.env.AUTH_BYPASS_2FA;
  delete process.env.AUTH_BYPASS_2FA;

  try {
    const suffix = crypto.randomUUID();
    const email = `twofactor-${suffix}@example.com`;
    const password = 'Password1';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      fullName: `Two Factor ${suffix}`,
      email,
      passwordHash,
      providers: [{ provider: 'local' }],
      isVerified: true,
      twoFactor: { enabled: true },
    });

    const { response, payload } = await jsonRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email, password },
    });

    assert.equal(response.status, 200);
    assert.equal(payload?.success, true);
    assert.equal(payload?.requiresTwoFactor, true);
    assert.ok(payload?.challengeToken);
  } finally {
    if (original === undefined) {
      delete process.env.AUTH_BYPASS_2FA;
    } else {
      process.env.AUTH_BYPASS_2FA = original;
    }
  }
});

test('local login bypasses 2FA when AUTH_BYPASS_2FA=true', async () => {
  const original = process.env.AUTH_BYPASS_2FA;
  process.env.AUTH_BYPASS_2FA = 'true';

  try {
    const suffix = crypto.randomUUID();
    const email = `twofactor-bypass-${suffix}@example.com`;
    const password = 'Password1';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      fullName: `Two Factor Bypass ${suffix}`,
      email,
      passwordHash,
      providers: [{ provider: 'local' }],
      isVerified: true,
      twoFactor: { enabled: true },
    });

    const { response, payload } = await jsonRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email, password },
    });

    assert.equal(response.status, 200);
    assert.equal(payload?.success, true);
    assert.equal(payload?.requiresTwoFactor, false);
    assert.equal(payload?.profile?.email, email);
  } finally {
    if (original === undefined) {
      delete process.env.AUTH_BYPASS_2FA;
    } else {
      process.env.AUTH_BYPASS_2FA = original;
    }
  }
});

test('local login bypasses email verification when AUTH_BYPASS_2FA=true', async () => {
  const original = process.env.AUTH_BYPASS_2FA;
  process.env.AUTH_BYPASS_2FA = 'true';

  try {
    const suffix = crypto.randomUUID();
    const email = `unverified-bypass-${suffix}@example.com`;
    const password = 'Password1';
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      fullName: `Unverified Bypass ${suffix}`,
      email,
      passwordHash,
      providers: [{ provider: 'local' }],
      isVerified: false,
      twoFactor: { enabled: false },
    });

    const { response, payload } = await jsonRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email, password },
    });

    assert.equal(response.status, 200);
    assert.equal(payload?.success, true);
    assert.equal(payload?.requiresTwoFactor, false);
    assert.equal(payload?.profile?.email, email);
  } finally {
    if (original === undefined) {
      delete process.env.AUTH_BYPASS_2FA;
    } else {
      process.env.AUTH_BYPASS_2FA = original;
    }
  }
});
