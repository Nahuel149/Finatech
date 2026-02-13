const {
  listOperations,
  getOperationById,
  createOperation,
  updateOperationState,
  updateOperationDetails,
  archiveOperations,
  restoreOperations,
} = require('../services/logistics.service');

const parseFiltersFromQuery = (query) => ({
  search: query.search || query.q || '',
  type: query.type || '',
  state: query.state || '',
  contact: query.contact || '',
  responsible: query.responsible || '',
  dateFrom: query.dateFrom || query.from || '',
  dateTo: query.dateTo || query.to || '',
  archived: query.archived || '',
});

const parsePaginationFromQuery = (query) => ({
  page: query.page ? Number(query.page) : undefined,
  limit: query.limit ? Number(query.limit) : undefined,
});

const getLogisticsOperations = async (req, res, next) => {
  try {
    const filters = parseFiltersFromQuery(req.query || {});
    const pagination = parsePaginationFromQuery(req.query || {});
    const result = await listOperations({ filters, ...pagination });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getLogisticsOperationById = async (req, res, next) => {
  try {
    const operation = await getOperationById(req.params.id);
    if (!operation) {
      return res.status(404).json({ message: 'Operación logística no encontrada' });
    }
    res.json(operation);
  } catch (error) {
    next(error);
  }
};

const createLogisticsOperation = async (req, res, next) => {
  try {
    let payload = req.body || {};
    if (typeof req.body?.payload === 'string') {
      try {
        payload = JSON.parse(req.body.payload);
      } catch {
        payload = req.body || {};
      }
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const operation = await createOperation(payload || {}, files);
    res.status(201).json(operation);
  } catch (error) {
    next(error);
  }
};

const patchLogisticsOperationState = async (req, res, next) => {
  try {
    const operation = await updateOperationState(req.params.id, req.body || {});
    res.json(operation);
  } catch (error) {
    next(error);
  }
};

const patchLogisticsOperation = async (req, res, next) => {
  try {
    const operation = await updateOperationDetails(req.params.id, req.body || {});
    res.json(operation);
  } catch (error) {
    next(error);
  }
};

const archiveLogisticsOperations = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === 'string' && id.trim()) : [];
    if (!ids.length) {
      return res.status(400).json({ message: 'Seleccioná operaciones para archivar.' });
    }
    const result = await archiveOperations(ids);
    res.json({ archived: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

const unarchiveLogisticsOperations = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === 'string' && id.trim()) : [];
    if (!ids.length) {
      return res.status(400).json({ message: 'Seleccioná operaciones para restaurar.' });
    }
    const result = await restoreOperations(ids);
    res.json({ restored: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogisticsOperations,
  getLogisticsOperationById,
  createLogisticsOperation,
  patchLogisticsOperationState,
  patchLogisticsOperation,
  archiveLogisticsOperations,
  unarchiveLogisticsOperations,
};
