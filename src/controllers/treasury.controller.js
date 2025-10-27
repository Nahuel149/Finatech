const {
  getTreasuryBalances,
  listTreasuryMovements,
  registerTreasuryMovement,
  getTreasuryMovementById,
  compensateTreasuryMovement,
  cancelTreasuryMovement,
  suggestCompensationsForMovement,
  getLinkedBalancesSummary,
  getLinkedBalanceDetail,
} = require('../services/treasury.service');

const parseFilters = (query) => {
  const filters = {};
  if (query.type) filters.type = String(query.type).toLowerCase();
  if (query.medium) filters.medium = String(query.medium).toLowerCase();
  if (query.currency) filters.currency = String(query.currency).toUpperCase();
  if (query.status) filters.status = String(query.status).toLowerCase();
  if (query.contact) filters.contact = query.contact;
  if (query.dateFrom) filters.dateFrom = query.dateFrom;
  if (query.dateTo) filters.dateTo = query.dateTo;
  if (query.search) filters.search = query.search;
  return filters;
};

const balances = async (_req, res, next) => {
  try {
    const balancesData = await getTreasuryBalances();
    res.json({ balances: balancesData });
  } catch (error) {
    next(error);
  }
};

const linkedBalancesSummary = async (_req, res, next) => {
  try {
    const summary = await getLinkedBalancesSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const linkedBalanceDetail = async (req, res, next) => {
  try {
    const result = await getLinkedBalanceDetail(req.params.balanceKey || req.params.id, {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      type: req.query.type,
      contactId: req.query.contactId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      sortBy = 'movementAt',
      sortDirection = 'desc',
      ...filterQuery
    } = req.query;

    const filters = parseFilters(filterQuery);
    const result = await listTreasuryMovements({
      page,
      limit,
      sortBy,
      sortDirection,
      filters,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await registerTreasuryMovement(req.body, {
      userId: req.user?.id || req.user?._id,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const detail = async (req, res, next) => {
  try {
    const movement = await getTreasuryMovementById(req.params.movementId || req.params.id);
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const compensate = async (req, res, next) => {
  try {
    const movement = await compensateTreasuryMovement(req.params.movementId || req.params.id, req.body, {
      userId: req.user?.id || req.user?._id,
    });
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const movement = await cancelTreasuryMovement(req.params.movementId || req.params.id, req.body, {
      userId: req.user?.id || req.user?._id,
    });
    res.json({ movement });
  } catch (error) {
    next(error);
  }
};

const suggestions = async (req, res, next) => {
  try {
    const result = await suggestCompensationsForMovement(
      req.params.movementId || req.params.id,
      {
        limit: req.query.limit,
      }
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  balances,
  list,
  create,
  detail,
  compensate,
  cancel,
  suggestions,
  linkedBalancesSummary,
  linkedBalanceDetail,
};
