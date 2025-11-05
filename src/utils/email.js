const nodemailer = require('nodemailer');

let cachedTransport = null;

const buildSmtpTransport = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (cachedTransport) {
    return cachedTransport;
  }

  const requestedPort = Number(process.env.SMTP_PORT);
  const port = Number.isFinite(requestedPort) && requestedPort > 0 ? requestedPort : 587;
  const forceSecure = process.env.SMTP_SECURE === 'true';
  const secure = forceSecure || port === 465;
  const requireTls = process.env.SMTP_REQUIRE_TLS !== 'false';
  const pool = process.env.SMTP_USE_POOL === 'true';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: requireTls && !secure,
    pool,
    auth: {
      user,
      pass,
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 15000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || (pool ? 3 : undefined),
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || (pool ? 50 : undefined),
    tls:
      process.env.SMTP_IGNORE_TLS_ERRORS === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  cachedTransport = transporter;
  return cachedTransport;
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

const sendEmail = async ({ to, subject, html, text, from: explicitFrom }) => {
  const recipients = normalizeRecipients(to);

  if (recipients.length === 0) {
    return;
  }

  const smtpTransport = buildSmtpTransport();
  if (smtpTransport) {
    const resolvedFromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME;
    const defaultFrom = fromName && resolvedFromEmail ? `${fromName} <${resolvedFromEmail}>` : resolvedFromEmail;
    const fromAddress = explicitFrom || defaultFrom;

    await smtpTransport.sendMail({
      from: fromAddress,
      to: recipients,
      subject,
      text,
      html,
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.log('----- Email Log (delivery disabled) -----');
  // eslint-disable-next-line no-console
  console.log({ to: recipients, subject, text, html });
};

const verifySmtpConnection = async () => {
  const smtpTransport = buildSmtpTransport();
  if (smtpTransport) {
    try {
      await smtpTransport.verify();
      return { ok: true, provider: 'smtp' };
    } catch (error) {
      return {
        ok: false,
        provider: 'smtp',
        message: error?.message || 'Unable to reach SMTP server',
      };
    }
  }

  return {
    ok: false,
    message: 'No email provider configured (SMTP_* env vars missing)',
  };
};

module.exports = { sendEmail, verifySmtpConnection };
