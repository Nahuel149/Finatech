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

router.use(requireAuth);

router.get('/balances', requirePermission('access-treasury'), balances);
router.get('/balances/overview', requirePermission('access-treasury'), globalOverview);
router.get(
  '/balances/contacts/:contactId',
  requirePermission('access-treasury'),
  contactBalanceDetail
);
router.get('/linked-balances', requirePermission('access-treasury'), linkedBalancesSummary);
router.get(
  '/linked-balances/:balanceKey',
  requirePermission('access-treasury'),
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
