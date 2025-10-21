const { Router } = require('express');
const {
  getLogisticsOperations,
  getLogisticsOperationById,
  createLogisticsOperation,
  patchLogisticsOperationState,
} = require('../controllers/logistics.controller');

const router = Router();

router.get('/operations', getLogisticsOperations);
router.post('/operations', createLogisticsOperation);
router.get('/operations/:id', getLogisticsOperationById);
router.patch('/operations/:id/state', patchLogisticsOperationState);

module.exports = router;
