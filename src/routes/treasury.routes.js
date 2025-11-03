const { Router } = require('express');
const {
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
} = require('../controllers/treasury.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');

const router = Router();
const VIEW_BALANCES_PERMISSIONS = ['view-balances', 'access-treasury'];

router.use(requireAuth);

router.get('/balances', requirePermission(VIEW_BALANCES_PERMISSIONS), balances);
router.get('/balances/overview', requirePermission(VIEW_BALANCES_PERMISSIONS), globalOverview);
router.get(
  '/balances/contacts/:contactId',
  requirePermission(VIEW_BALANCES_PERMISSIONS),
  contactBalanceDetail
);
router.get('/linked-balances', requirePermission(VIEW_BALANCES_PERMISSIONS), linkedBalancesSummary);
router.get(
  '/linked-balances/:balanceKey',
  requirePermission(VIEW_BALANCES_PERMISSIONS),
  linkedBalanceDetail
);

router.get(
  '/movements/:movementId/suggestions',
  requirePermission('access-treasury'),
  suggestions
);
router.get('/movements', requirePermission('access-treasury'), list);
router.post('/movements', requirePermission('manage-treasury'), create);
router.get('/movements/:movementId', requirePermission('access-treasury'), detail);
router.post(
  '/movements/:movementId/compensate',
  requirePermission('manage-treasury'),
  compensate
);
router.post('/movements/:movementId/cancel', requirePermission('manage-treasury'), cancel);

module.exports = router;
