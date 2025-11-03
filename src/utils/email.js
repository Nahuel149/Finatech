const { Resend } = require('resend');

let cachedClient = null;

const getResendClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  cachedClient = new Resend(apiKey);
  return cachedClient;
};

const normalizeRecipients = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return [value];
};

const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResendClient();
  const recipients = normalizeRecipients(to);

  if (!client || recipients.length === 0) {
    // eslint-disable-next-line no-console
    console.log('----- Email Log (Resend disabled) -----');
    // eslint-disable-next-line no-console
    console.log({ to: recipients, subject, text, html });
    return;
  }

  const defaultFrom = process.env.RESEND_DEFAULT_FROM || 'Finatech <no-reply@finatech.resend.dev>';
  const from = process.env.RESEND_FROM_EMAIL || defaultFrom;

  await client.emails.send({
    from,
    to: recipients,
    subject,
    html,
    text,
  });
};

const verifySmtpConnection = async () => {
  const client = getResendClient();
  if (!client) {
    return { ok: false, message: 'RESEND_API_KEY not configured' };
  }

  try {
    // Lightweight call to validate the API key without sending an email.
    await client.apiKeys.list({ limit: 1 });
    return { ok: true, provider: 'resend' };
  } catch (error) {
    return {
      ok: false,
      provider: 'resend',
      message: error?.message || 'Unable to reach Resend API',
    };
  }
};

module.exports = { sendEmail, verifySmtpConnection };
