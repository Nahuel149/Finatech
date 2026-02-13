const { Router } = require('express');
const multer = require('multer');
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
const { requirePermission } = require('../middleware/requirePermission');

const router = Router();
// Mock change for git workflow validation.
const READ_LOGISTICS_PERMISSIONS = ['access-logistics', 'manage-logistics'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

const maybeUploadFiles = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }
  return upload.array('files', 5)(req, res, next);
};

router.use(requireAuth);
router.use(requirePermission(READ_LOGISTICS_PERMISSIONS));

router.get('/operations', getLogisticsOperations);
router.post('/operations', requirePermission('manage-logistics'), maybeUploadFiles, createLogisticsOperation);
router.post('/operations/archive', requirePermission('manage-logistics'), archiveLogisticsOperations);
router.post('/operations/unarchive', requirePermission('manage-logistics'), unarchiveLogisticsOperations);
router.get('/operations/:id', getLogisticsOperationById);
router.patch('/operations/:id', requirePermission('manage-logistics'), patchLogisticsOperation);
router.patch('/operations/:id/state', requirePermission('manage-logistics'), patchLogisticsOperationState);

module.exports = router;
