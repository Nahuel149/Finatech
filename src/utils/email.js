const nodemailer = require('nodemailer');

let cachedTransport = null;

const buildTransport = ({ port, secure, host, user, pass }) => {
  const SMTP_HOST = host || process.env.SMTP_HOST;
  const SMTP_USER = user ?? process.env.SMTP_USER;
  const SMTP_PASS = pass ?? process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 15000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
    pool: true,
    maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS) || 3,
    maxMessages: Number(process.env.SMTP_MAX_MESSAGES) || 50,
    logger: process.env.SMTP_DEBUG_LOGS === 'true',
    debug: process.env.SMTP_DEBUG_LOGS === 'true',
  });
};

const getConfiguredPort = () => {
  const requested = Number(process.env.SMTP_PORT);
  if (Number.isFinite(requested) && requested > 0) {
    return requested;
  }
  return 587;
};

const getTransport = async ({ forceNew = false, port, secure } = {}) => {
  if (!forceNew && cachedTransport) {
    return cachedTransport;
  }

  const { SMTP_HOST } = process.env;

  if (!SMTP_HOST) {
    // eslint-disable-next-line no-console
    console.warn('SMTP_HOST not configured. Emails will be logged to the console.');
    return null;
  }

  const resolvedPort = port ?? getConfiguredPort();
  const resolvedSecure = secure ?? resolvedPort === 465;
  const transport = buildTransport({ port: resolvedPort, secure: resolvedSecure });

  if (!forceNew) {
    cachedTransport = transport;
  }

  return transport;
};

const shouldAttemptTlsFallback = (error, transport) => {
  if (!error) {
    return false;
  }

  const transientCodes = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNRESET'];
  const currentPort = transport?.options?.port;
  const currentSecure = Boolean(transport?.options?.secure);

  return (
    transientCodes.includes(error.code) &&
    Number(currentPort) === 587 &&
    currentSecure === false
  );
};

const getBackupTransportIfConfigured = () => {
  const host = process.env.SMTP_BACKUP_HOST;
  const port = Number(process.env.SMTP_BACKUP_PORT) || 587;
  const user = process.env.SMTP_BACKUP_USER;
  const pass = process.env.SMTP_BACKUP_PASS;
  if (!host) {
    return null;
  }
  const secure = port === 465;
  return buildTransport({ port, secure, host, user, pass });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendWithRetries = async (transport, mailOptions) => {
  const maxAttempts = Number(process.env.SMTP_RETRY_ATTEMPTS) || 2;
  const backoffMs = Number(process.env.SMTP_RETRY_BACKOFF_MS) || 1500;

  let lastError = null;
  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
    try {
      // Verify connection before sending to surface DNS/connectivity issues early
      if (typeof transport.verify === 'function') {
        await transport.verify();
      }
      await transport.sendMail(mailOptions);
      return; // success
    } catch (error) {
      lastError = error;
      // eslint-disable-next-line no-console
      console.warn(
        `SMTP send attempt ${attempt} failed (${error.code || 'UNKNOWN'}) on ${transport.options.host}:${transport.options.port}`
      );

      // TLS fallback for transient errors on STARTTLS (587)
      if (shouldAttemptTlsFallback(error, transport)) {
        // eslint-disable-next-line no-console
        console.warn('Retrying with implicit TLS (465)...');
        cachedTransport = null;
        const tlsTransport = await getTransport({ forceNew: true, port: 465, secure: true });
        transport = tlsTransport; // mutate for any further retries
        continue; // next loop iteration will retry immediately with new transport
      }

      // Transient error: wait and retry
      const transientCodes = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNRESET'];
      if (transientCodes.includes(error.code) && attempt < Math.max(1, maxAttempts)) {
        await sleep(backoffMs * attempt);
        continue;
      }

      // Non-transient error: break and throw
      break;
    }
  }

  throw lastError;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || 'no-reply@finatech.local';
  let transport = await getTransport();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log('----- Email Log -----');
    // eslint-disable-next-line no-console
    console.log({ to, subject, text, html });
    return;
  }

  try {
    await sendWithRetries(transport, { from, to, subject, text, html });
  } catch (error) {
    // Try backup SMTP if configured
    const backup = getBackupTransportIfConfigured();
    if (backup) {
      // eslint-disable-next-line no-console
      console.warn(
        `Primary SMTP failed (${error.code || 'UNKNOWN'}). Attempting backup SMTP at ${backup.options.host}:${backup.options.port}`
      );
      try {
        await sendWithRetries(backup, { from, to, subject, text, html });
        return;
      } catch (backupErr) {
        // eslint-disable-next-line no-console
        console.error('Backup SMTP also failed', backupErr);
      }
    }
    throw error;
  }
};

const verifySmtpConnection = async () => {
  const transport = await getTransport();
  if (!transport) {
    return { ok: false, message: 'SMTP_HOST not configured' };
  }
  try {
    if (typeof transport.verify === 'function') {
      await transport.verify();
    }
    return { ok: true, host: transport.options.host, port: transport.options.port };
  } catch (error) {
    return {
      ok: false,
      code: error.code,
      message: error.message,
      host: transport.options.host,
      port: transport.options.port,
    };
  }
};

module.exports = { sendEmail, verifySmtpConnection };
