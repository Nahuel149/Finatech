const test = require('node:test');
const assert = require('node:assert/strict');

const { sendEmail, verifySmtpConnection } = require('../../src/utils/email');

const buildMockFetch = ({ ok = true, status = 200, json = {} } = {}) =>
  async () => ({
    ok,
    status,
    text: async () => JSON.stringify(json),
    json: async () => json,
  });

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

test('sendEmail uses Resend when RESEND_API_KEY is set', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (...args) => {
    calls.push(args);
    return buildMockFetch({ ok: true, status: 200, json: { id: 'email_123' } })();
  };

  await withEnv(
    {
      RESEND_API_KEY: 're_xxxxxxxxx',
      RESEND_FROM_EMAIL: 'onboarding@resend.dev',
      RESEND_FROM_NAME: 'FinaTech',
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
    },
    async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Hello World',
        html: '<p>Test</p>',
      });
    }
  );

  global.fetch = originalFetch;

  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.match(String(url), /api\.resend\.com\/emails/i);
  assert.equal(options?.method, 'POST');
  assert.match(String(options?.headers?.Authorization || ''), /^Bearer re_/);

  const body = JSON.parse(options?.body || '{}');
  assert.equal(body.from, 'FinaTech <onboarding@resend.dev>');
  assert.deepEqual(body.to, ['test@example.com']);
  assert.equal(body.subject, 'Hello World');
  assert.equal(body.html, '<p>Test</p>');
});

test('verifySmtpConnection reports resend when configured', async () => {
  await withEnv(
    {
      RESEND_API_KEY: 're_xxxxxxxxx',
      RESEND_FROM_EMAIL: 'onboarding@resend.dev',
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
    },
    async () => {
      const result = await verifySmtpConnection();
      assert.equal(result.ok, true);
      assert.equal(result.provider, 'resend');
    }
  );
});
