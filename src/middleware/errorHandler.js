const { logger } = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error('request_error', {
    method: req.method,
    path: req.originalUrl,
    status: err.status || 500,
    message: err.message,
  });

  if (res.headersSent) {
    return;
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const details = err.details || undefined;
  const code = err.code || undefined;

  res.status(status).json({ message, code, details });
};

module.exports = { errorHandler };
