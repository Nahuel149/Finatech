const {
  listByOperation,
  createFromOperation,
  updateOrder,
  getOrderById,
  listAssignedOrders,
  startRoute,
  arriveOnSite,
  updateItemsOnHandover,
  addEvidence,
  completeTotal,
  completePartial,
  reportDiscrepancy,
  getOrderTimeline,
  listMessengerOptions,
} = require('../services/logisticsOrder.service');
const { logger } = require('../utils/logger');

const buildContext = (req) => ({
  userId: req.user?._id || req.user?.id || null,
  userName: req.user?.fullName || req.user?.email || null,
  user: req.user || null,
});

const getOperationLogisticsOrders = async (req, res, next) => {
  try {
    const payload = await listByOperation(req.params.operationId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const createOperationLogisticsOrder = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await createFromOperation(req.params.operationId, req.body || {}, context);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const updateLogisticsOrder = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await updateOrder(req.params.orderId, req.body || {}, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const getLogisticsOrder = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.orderId);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const getMyLogisticsOrders = async (req, res, next) => {
  try {
    const context = buildContext(req);
    logger.debug('logistics_orders_query', { query: req.query });
    const payload = await listAssignedOrders(context.userId, req.query || {});
    logger.debug('logistics_orders_listed', {
      userId: context.userId ? String(context.userId) : null,
      count: payload.orders?.length || 0,
    });
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

const startLogisticsRoute = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await startRoute(req.params.orderId, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const arriveAtLogisticsOrder = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await arriveOnSite(req.params.orderId, req.body || {}, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const updateLogisticsItems = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await updateItemsOnHandover(req.params.orderId, req.body || {}, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const uploadLogisticsEvidence = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await addEvidence(req.params.orderId, req.body || {}, req.files || [], context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const completeLogisticsOrderTotal = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await completeTotal(req.params.orderId, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const completeLogisticsOrderPartial = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await completePartial(req.params.orderId, req.body || {}, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const reportLogisticsDiscrepancyController = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const order = await reportDiscrepancy(req.params.orderId, req.body || {}, context);
    res.json(order);
  } catch (error) {
    next(error);
  }
};

const getLogisticsOrderTimeline = async (req, res, next) => {
  try {
    const context = buildContext(req);
    const timeline = await getOrderTimeline(req.params.orderId, context.userId);
    res.json({ timeline });
  } catch (error) {
    next(error);
  }
};

const getLogisticsMessengers = async (_req, res, next) => {
  try {
    const messengers = await listMessengerOptions();
    res.json({ messengers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOperationLogisticsOrders,
  createOperationLogisticsOrder,
  updateLogisticsOrder,
  getLogisticsOrder,
  getMyLogisticsOrders,
  startLogisticsRoute,
  arriveAtLogisticsOrder,
  updateLogisticsItems,
  uploadLogisticsEvidence,
  completeLogisticsOrderTotal,
  completeLogisticsOrderPartial,
  reportLogisticsDiscrepancyController,
  getLogisticsOrderTimeline,
  getLogisticsMessengers,
};
