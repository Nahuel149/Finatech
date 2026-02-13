const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Session = require('../../src/models/Session');
const TwoFactorChallenge = require('../../src/models/TwoFactorChallenge');
const { hashToken } = require('../../src/utils/token');

let mongoServer;
let server;
let baseUrl;

const withEnv = async (patch, fn) => {
  const original = {};
  for (const key of Object.keys(patch)) {
    original[key] = process.env[key];
    if (patch[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = patch[key];
    }
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(patch)) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  }
};

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

const createAuthContext = async ({ twoFactorEnabled }) => {
  const suffix = crypto.randomUUID();
  const user = await User.create({
    fullName: `2FA Toggle ${suffix}`,
    email: `twofactor-toggle-${suffix}@example.com`,
    isVerified: true,
    providers: [{ provider: 'local' }],
    twoFactor: { enabled: Boolean(twoFactorEnabled) },
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
    TwoFactorChallenge.deleteMany({}),
    Session.deleteMany({}),
    User.deleteMany({}),
  ]);
});

test('2FA toggle requires email code confirmation before enabling', async () => {
  const originalFetch = global.fetch;
  const fetchCalls = [];
  global.fetch = async (...args) => {
    const [url] = args;
    const urlString = typeof url === 'string' ? url : url?.toString?.();

    if (urlString && urlString.startsWith('https://api.resend.com') && urlString.includes('/emails')) {
      fetchCalls.push(args);
      return {
        ok: true,
        text: async () => JSON.stringify({ id: 'email_test' }),
      };
    }

    return originalFetch(...args);
  };

  await withEnv(
    {
      AUTH_BYPASS_2FA: 'false',
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM_EMAIL: 'onboarding@resend.dev',
    },
    async () => {
      const auth = await createAuthContext({ twoFactorEnabled: false });

      const { response, payload } = await jsonRequest({
        method: 'POST',
        path: '/api/auth/profile/2fa',
        body: { enabled: true },
        cookie: auth.cookie,
        csrfToken: auth.csrfToken,
      });

      assert.equal(response.status, 200);
      assert.equal(payload?.success, true);
      assert.equal(payload?.requiresConfirmation, true);
      assert.ok(payload?.challengeId);

      const challenge = await TwoFactorChallenge.findOne({
        token: hashToken(payload.challengeId),
        purpose: 'toggle_2fa',
      });
      assert.ok(challenge);

      // Force a known code for deterministic verification
      challenge.codeHash = hashToken('123456');
      await challenge.save();

      const confirm = await jsonRequest({
        method: 'POST',
        path: '/api/auth/profile/2fa/confirm',
        body: { challengeId: payload.challengeId, code: '123456' },
        cookie: auth.cookie,
        csrfToken: auth.csrfToken,
      });

      assert.equal(confirm.response.status, 200);
      assert.equal(confirm.payload?.success, true);
      assert.equal(confirm.payload?.profile?.twoFactor?.isEnabled, true);

      const remaining = await TwoFactorChallenge.findOne({ _id: challenge._id });
      assert.equal(remaining, null);
      assert.ok(fetchCalls.length >= 1);
    }
  );

  global.fetch = originalFetch;
});
