const {
  getIncident,
  listIncidents,
  updateIncidentStatus,
} = require('../services/logisticsIncident.service');

const listLogisticsIncidents = async (req, res, next) => {
  try {
    const incidents = await listIncidents({
      status: req.query.status,
      severity: req.query.severity,
      limit: req.query.limit,
    });
    res.json({ data: incidents });
  } catch (error) {
    next(error);
  }
};

const getLogisticsIncident = async (req, res, next) => {
  try {
    const incident = await getIncident(req.params.incidentId);
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

const patchLogisticsIncidentStatus = async (req, res, next) => {
  try {
    const incident = await updateIncidentStatus(req.params.incidentId, req.body?.status);
    res.json(incident);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLogisticsIncidents,
  getLogisticsIncident,
  patchLogisticsIncidentStatus,
};
