const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const validateRequest = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formatted = errors.array().map((error) => ({
    field: error.param,
    message: error.msg,
  }));

  next(new AppError('Validación fallida', 422, formatted));
};

module.exports = { validateRequest };
