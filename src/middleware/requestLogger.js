const { logger } = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.session?.user?._id ||
      req.session?.user?.id ||
      null;
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: userId ? String(userId) : null,
    });
  });
  next();
};

module.exports = { requestLogger };
