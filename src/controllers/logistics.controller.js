const {
  listOperations,
  getOperationById,
  createOperation,
  updateOperationState,
} = require('../services/logistics.service');

const parseFiltersFromQuery = (query) => ({
  search: query.search || query.q || '',
  type: query.type || '',
  state: query.state || '',
  contact: query.contact || '',
  responsible: query.responsible || '',
  dateFrom: query.dateFrom || query.from || '',
  dateTo: query.dateTo || query.to || '',
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
    const operation = await createOperation(req.body || {});
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

module.exports = {
  getLogisticsOperations,
  getLogisticsOperationById,
  createLogisticsOperation,
  patchLogisticsOperationState,
};
