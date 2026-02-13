const {
  getIncident,
  listIncidents,
  updateIncidentStatus,
  createIncident,
} = require('../services/logisticsIncident.service');
const { storeLogisticsIncidentAttachments } = require('../utils/logisticsIncidentAttachmentStorage');

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

const postLogisticsIncident = async (req, res, next) => {
  try {
    const movementId = req.body?.movementId;
    const status = req.body?.status || 'abierta';

    let data = req.body?.data || {};
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        data = {};
      }
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length) {
      const stored = await storeLogisticsIncidentAttachments(movementId, files, data?.responsible || null);
      const existing = Array.isArray(data.attachments) ? data.attachments : [];
      data = { ...data, attachments: [...existing, ...stored] };
    }

    const incident = await createIncident({
      movementId,
      data,
      status,
    });
    res.status(201).json(incident);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listLogisticsIncidents,
  getLogisticsIncident,
  patchLogisticsIncidentStatus,
  postLogisticsIncident,
};
