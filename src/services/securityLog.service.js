const SecurityLog = require('../models/SecurityLog');

const logSecurityEvent = async ({
  user,
  email,
  eventType,
  provider,
  status,
  ipAddress,
  userAgent,
  metadata,
}) => {
  try {
    await SecurityLog.create({
      user,
      email,
      eventType,
      provider,
      status,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log security event', error);
  }
};

module.exports = { logSecurityEvent };
