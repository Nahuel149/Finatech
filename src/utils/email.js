const nodemailer = require('nodemailer');

let cachedTransport = null;

const buildTransport = ({ port, secure }) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
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

  const transientCodes = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET'];
  const currentPort = transport?.options?.port;
  const currentSecure = Boolean(transport?.options?.secure);

  return (
    transientCodes.includes(error.code) &&
    Number(currentPort) === 587 &&
    currentSecure === false
  );
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
    await transport.sendMail({ from, to, subject, text, html });
  } catch (error) {
    if (shouldAttemptTlsFallback(error, transport)) {
      // eslint-disable-next-line no-console
      console.warn('SMTP connection failed on port 587. Retrying with implicit TLS (465)...');
      cachedTransport = null;
      transport = await getTransport({ forceNew: true, port: 465, secure: true });
      await transport.sendMail({ from, to, subject, text, html });
      cachedTransport = transport;
      return;
    }
    throw error;
  }
};

module.exports = { sendEmail };
