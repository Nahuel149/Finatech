const { Router } = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  listLogisticsIncidents,
  getLogisticsIncident,
  patchLogisticsIncidentStatus,
  postLogisticsIncident,
} = require('../controllers/logisticsIncident.controller');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } });

const maybeUploadFiles = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }
  return upload.array('files', 5)(req, res, next);
};

router.use(requireAuth);

router.get('/logistics/incidents', requirePermission('access-logistics'), listLogisticsIncidents);
router.get('/logistics/incidents/:incidentId', requirePermission('access-logistics'), getLogisticsIncident);
router.patch(
  '/logistics/incidents/:incidentId/status',
  requirePermission('access-logistics'),
  patchLogisticsIncidentStatus
);
router.post(
  '/logistics/incidents',
  requirePermission(['manage-logistics', 'access-logistics']),
  maybeUploadFiles,
  postLogisticsIncident
);

module.exports = router;
