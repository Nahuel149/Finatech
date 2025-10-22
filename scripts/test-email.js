require('dotenv').config();
const { sendEmail } = require('../src/utils/email');

(async () => {
  try {
    const to = process.env.SMTP_USER || 'renderfinatech@gmail.com';
    await sendEmail({
      to,
      subject: 'SMTP test from app',
      text: 'This is an app-level email.js test.',
      html: '<p>This is an app-level email.js test.</p>',
    });
    console.log('App sendEmail OK');
  } catch (err) {
    console.error('App sendEmail ERR', err && (err.code || err.message), err);
    process.exit(1);
  }
})();