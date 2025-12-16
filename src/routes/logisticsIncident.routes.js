const { Router } = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const {
  listLogisticsIncidents,
  getLogisticsIncident,
  patchLogisticsIncidentStatus,
  postLogisticsIncident,
} = require('../controllers/logisticsIncident.controller');

const router = Router();

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
  postLogisticsIncident
);

module.exports = router;
