const { Router } = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const {
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
} = require('../controllers/logisticsOrder.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 5 } });

router.use(requireAuth);

router.get(
  '/operations/:operationId/logistics-orders',
  requirePermission(['access-treasury', 'access-operations']),
  getOperationLogisticsOrders
);

router.post(
  '/operations/:operationId/logistics-orders',
  requirePermission(['access-treasury', 'access-operations']),
  createOperationLogisticsOrder
);

router.get(
  '/logistics-orders/:orderId',
  requirePermission(['access-treasury', 'access-operations']),
  getLogisticsOrder
);

router.put(
  '/logistics-orders/:orderId',
  requirePermission(['access-treasury', 'access-operations']),
  updateLogisticsOrder
);

router.get('/logistics/my-orders', requirePermission('access-logistics'), getMyLogisticsOrders);

router.get(
  '/logistics-orders/:orderId/timeline',
  requirePermission('access-logistics'),
  getLogisticsOrderTimeline
);

router.patch(
  '/logistics-orders/:orderId/start-route',
  requirePermission('access-logistics'),
  startLogisticsRoute
);

router.patch(
  '/logistics-orders/:orderId/arrive',
  requirePermission('access-logistics'),
  arriveAtLogisticsOrder
);

router.patch(
  '/logistics-orders/:orderId/items',
  requirePermission('access-logistics'),
  updateLogisticsItems
);

router.post(
  '/logistics-orders/:orderId/evidences',
  requirePermission('access-logistics'),
  upload.array('files', 5),
  uploadLogisticsEvidence
);

router.patch(
  '/logistics-orders/:orderId/complete-total',
  requirePermission('access-logistics'),
  completeLogisticsOrderTotal
);

router.patch(
  '/logistics-orders/:orderId/complete-partial',
  requirePermission('access-logistics'),
  completeLogisticsOrderPartial
);

router.patch(
  '/logistics-orders/:orderId/discrepancy',
  requirePermission('access-logistics'),
  reportLogisticsDiscrepancyController
);

module.exports = router;
