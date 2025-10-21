const { Router } = require('express');
const {
  summary,
  movements,
  listContacts,
  contactDetail,
} = require('../controllers/currentAccount.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');

const router = Router();

router.use(requireAuth, requirePermission('view-balances'));

router.get('/summary', summary);
router.get('/movements', movements);
router.get('/contacts', listContacts);
router.get('/contacts/:contactId', contactDetail);

module.exports = router;
