const { Router } = require('express');
const {
  getLogisticsOperations,
  getLogisticsOperationById,
  createLogisticsOperation,
  patchLogisticsOperationState,
  patchLogisticsOperation,
  archiveLogisticsOperations,
  unarchiveLogisticsOperations,
} = require('../controllers/logistics.controller');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

router.use(requireAuth);

router.get('/operations', getLogisticsOperations);
router.post('/operations', createLogisticsOperation);
router.post('/operations/archive', archiveLogisticsOperations);
router.post('/operations/unarchive', unarchiveLogisticsOperations);
router.get('/operations/:id', getLogisticsOperationById);
router.patch('/operations/:id', patchLogisticsOperation);
router.patch('/operations/:id/state', patchLogisticsOperationState);

module.exports = router;
