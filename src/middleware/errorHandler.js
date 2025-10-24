// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error(err);

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
