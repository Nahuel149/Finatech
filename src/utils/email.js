const nodemailer = require('nodemailer');

let cachedTransport = null;

const getTransport = async () => {
  if (cachedTransport) {
    return cachedTransport;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST) {
    // eslint-disable-next-line no-console
    console.warn('SMTP_HOST not configured. Emails will be logged to the console.');
    return null;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  cachedTransport = transport;
  return transport;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM || 'no-reply@finatech.local';
  const transport = await getTransport();

  if (!transport) {
    // eslint-disable-next-line no-console
    console.log('----- Email Log -----');
    // eslint-disable-next-line no-console
    console.log({ to, subject, text, html });
    return;
  }

  await transport.sendMail({ from, to, subject, text, html });
};

module.exports = { sendEmail };
