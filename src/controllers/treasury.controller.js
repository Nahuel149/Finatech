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
  getGlobalBalancesOverview,
  getContactBalanceDetail,
  listTreasuryReceptions,
  confirmTreasuryReception,
  omitTreasuryReception,
  revertTreasuryReception,
  listOperationSuggestions,
} = require('../services/treasury.service');
const { storeTreasuryAttachments } = require('../utils/treasuryAttachmentStorage');

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

const parseReceptionFilters = (query = {}) => {
  const filters = {};
  if (query.status) {
    filters.status = String(query.status).toLowerCase();
  }
  if (query.dateFrom) filters.dateFrom = query.dateFrom;
  if (query.dateTo) filters.dateTo = query.dateTo;
  if (query.courierId) filters.courierId = query.courierId;
  if (query.courier) filters.courier = query.courier;
  if (query.contactId) filters.contactId = query.contactId;
  if (query.contact) filters.contact = query.contact;
  if (query.operationId) filters.operationId = query.operationId;
  if (query.amountMin !== undefined) filters.amountMin = query.amountMin;
  if (query.amountMax !== undefined) filters.amountMax = query.amountMax;
  if (query.currency) filters.currency = String(query.currency).toUpperCase();
  if (query.search) filters.search = query.search;
  return filters;
};

const buildActionContext = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  userName: req.user?.fullName || req.user?.email || null,
  ip: req.ip,
  userAgent: req.get('user-agent') || null,
});

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

const globalOverview = async (req, res, next) => {
  try {
    const result = await getGlobalBalancesOverview({
      currency: req.query.currency,
      accountKey: req.query.accountKey,
      search: req.query.search,
      contactType: req.query.contactType,
      balanceState: req.query.balanceState,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortDirection: req.query.sortDirection,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const contactBalanceDetail = async (req, res, next) => {
  try {
    const result = await getContactBalanceDetail(req.params.contactId || req.params.id, {
      currency: req.query.currency,
      operationType: req.query.operationType,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search,
      accountKey: req.query.accountKey,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortDirection: req.query.sortDirection,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const listReceptions = async (req, res, next) => {
  try {
    const { page, limit, ...rest } = req.query || {};
    const filters = parseReceptionFilters(rest);
    const response = await listTreasuryReceptions({
      ...filters,
      page,
      limit,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const confirmReception = async (req, res, next) => {
  try {
    const context = buildActionContext(req);
    const reception = await confirmTreasuryReception(req.params.id || req.params.receptionId, req.body || {}, context);
    res.json(reception);
  } catch (error) {
    next(error);
  }
};

const omitReception = async (req, res, next) => {
  try {
    const context = buildActionContext(req);
    const reception = await omitTreasuryReception(req.params.id || req.params.receptionId, req.body || {}, context);
    res.json(reception);
  } catch (error) {
    next(error);
  }
};

const revertReception = async (req, res, next) => {
  try {
    const context = buildActionContext(req);
    const reception = await revertTreasuryReception(
      req.params.id || req.params.receptionId,
      req.body || {},
      context
    );
    res.json(reception);
  } catch (error) {
    next(error);
  }
};

const operationSuggestions = async (req, res, next) => {
  try {
    const suggestions = await listOperationSuggestions({
      search: req.query.search || req.query.q || '',
      contactId: req.query.contactId || req.query.contact,
      limit: req.query.limit,
    });
    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};

const uploadTreasuryAttachments = async (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const attachments = await storeTreasuryAttachments(files);
    res.json({ attachments });
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
  globalOverview,
  contactBalanceDetail,
  listReceptions,
  confirmReception,
  omitReception,
  revertReception,
  operationSuggestions,
  uploadTreasuryAttachments,
};
