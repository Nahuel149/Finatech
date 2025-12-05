const { validationResult } = require('express-validator');
const { searchClients, getClientById, createClient, updateClient } = require('../services/client.service');

const listClients = async (req, res, next) => {
  try {
    const { q, query, limit } = req.query;
    const results = await searchClients({
      query: q || query || '',
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ items: results });
  } catch (error) {
    next(error);
  }
};

const findClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await getClientById(id);
    if (!client) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }
    res.json(client);
  } catch (error) {
    next(error);
  }
};

const createClientHandler = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
    return;
  }

  try {
    const client = await createClient(req.body);
    res.status(201).json(client);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({
        message: 'El cliente ya existe',
        errors: [
          {
            field: Object.keys(error.keyPattern || {})[0] || 'cuit',
            message: 'Ya existe un registro con este valor.',
          },
        ],
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        message: 'Validation failed',
        errors: Object.entries(error.errors || {}).map(([field, detail]) => ({
          field,
          message: detail.message,
        })),
      });
      return;
    }

    next(error);
  }
};

const updateClientHandler = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
    return;
  }

  try {
    const { id } = req.params;
    const client = await updateClient(id, req.body);
    res.json(client);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error.code === 11000) {
      res.status(409).json({
        message: 'El cliente ya existe',
        errors: [
          {
            field: Object.keys(error.keyPattern || {})[0] || 'cuit',
            message: 'Ya existe un registro con este valor.',
          },
        ],
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        message: 'Validation failed',
        errors: Object.entries(error.errors || {}).map(([field, detail]) => ({
          field,
          message: detail.message,
        })),
      });
      return;
    }

    next(error);
  }
};

module.exports = {
  listClients,
  findClient,
  createClient: createClientHandler,
  updateClient: updateClientHandler,
};
