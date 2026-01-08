const SecurityLog = require('../models/SecurityLog');
const { logger } = require('../utils/logger');

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
    logger.error('security_log_failed', { message: error.message });
  }
};

module.exports = { logSecurityEvent };
