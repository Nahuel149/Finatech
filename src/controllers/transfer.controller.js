const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const {
  registerTransferOperation,
  getTransferOperationById,
  listTransferOperations,
} = require('../services/transfer.service');

const createTransferOperation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const context = {
      userId: req.user?._id || req.user?.id || null,
    };

    const result = await registerTransferOperation(req.body, context);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const fetchTransferOperation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const operation = await getTransferOperationById(id);
    if (!operation) {
      throw new AppError('Transferencia no encontrada.', 404);
    }
    res.json(operation);
  } catch (error) {
    next(error);
  }
};

const listTransferOperationsHandler = async (req, res, next) => {
  try {
    const { limit, skip } = req.query;
    const operations = await listTransferOperations({ limit, skip });
    res.json({ items: operations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransferOperation,
  fetchTransferOperation,
  listTransferOperations: listTransferOperationsHandler,
};
