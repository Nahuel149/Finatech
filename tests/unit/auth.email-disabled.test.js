const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../../src/models/User');
const {
  resendVerificationEmail,
  requestPasswordReset,
} = require('../../src/services/auth.service');

let mongoServer;

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

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    dbName: 'finatech-unit',
  });
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.beforeEach(async () => {
  await User.deleteMany({});
});

test('resendVerificationEmail does not send when AUTH_BYPASS_2FA=true', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (...args) => {
    calls.push(args);
    throw new Error('fetch should not be called');
  };

  await withEnv(
    {
      AUTH_BYPASS_2FA: 'true',
      RESEND_API_KEY: 're_xxxxxxxxx',
      RESEND_FROM_EMAIL: 'onboarding@resend.dev',
    },
    async () => {
      const suffix = crypto.randomUUID();
      const email = `unverified-${suffix}@example.com`;
      await User.create({
        fullName: `User ${suffix}`,
        email,
        isVerified: false,
        providers: [{ provider: 'local' }],
      });

      const result = await resendVerificationEmail({ email }, { ip: '127.0.0.1', userAgent: 'test' });
      assert.match(String(result?.message || ''), /deshabilitada/i);
      assert.equal(calls.length, 0);
    }
  );

  global.fetch = originalFetch;
});

test('requestPasswordReset does not send when AUTH_BYPASS_2FA=true', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (...args) => {
    calls.push(args);
    throw new Error('fetch should not be called');
  };

  await withEnv(
    {
      AUTH_BYPASS_2FA: 'true',
      RESEND_API_KEY: 're_xxxxxxxxx',
      RESEND_FROM_EMAIL: 'onboarding@resend.dev',
    },
    async () => {
      const suffix = crypto.randomUUID();
      const email = `reset-${suffix}@example.com`;
      await User.create({
        fullName: `User ${suffix}`,
        email,
        isVerified: true,
        providers: [{ provider: 'local' }],
      });

      const result = await requestPasswordReset({ email }, { ip: '127.0.0.1', userAgent: 'test' });
      assert.match(String(result?.message || ''), /si existe una cuenta/i);
      assert.equal(calls.length, 0);
    }
  );

  global.fetch = originalFetch;
});

