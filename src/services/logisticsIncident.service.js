const mongoose = require('mongoose');
const LogisticsIncident = require('../models/LogisticsIncident');
const AppError = require('../utils/AppError');

const toIncidentDto = (incidentDoc) => {
  if (!incidentDoc) {
    return null;
  }
  const incident = incidentDoc.toObject({ virtuals: false });
  return {
    id: incident._id.toString(),
    incidentCode: incident.incidentCode,
    status: incident.status,
    severity: incident.severity,
    type: incident.type,
    reportDate: incident.reportDate,
    resolutionDate: incident.resolutionDate,
    responsible: incident.responsible,
    reportedBy: incident.reportedBy,
    associatedMovement: incident.associatedMovement,
    logisticsOrderId: incident.logisticsOrderId,
    description: incident.description,
    operationalImpacts: incident.operationalImpacts || [],
    involvedItems: incident.involvedItems || [],
    attachedDocuments: incident.attachedDocuments || [],
    changeHistory: incident.changeHistory || [],
    resolutionDetails: incident.resolutionDetails,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
};

const normalizeIncidentIdentifier = (identifier) => {
  if (!identifier) {
    return null;
  }
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { _id: identifier };
  }
  return { incidentCode: String(identifier).trim().toUpperCase() };
};

const findIncidentByIdentifier = async (identifier) => {
  const query = normalizeIncidentIdentifier(identifier);
  if (!query) {
    return null;
  }
  return LogisticsIncident.findOne(query);
};

const getIncident = async (identifier) => {
  const incident = await findIncidentByIdentifier(identifier);
  if (!incident) {
    throw new AppError('Incidencia logística no encontrada.', 404);
  }
  return toIncidentDto(incident);
};

const listIncidents = async ({ status, severity, limit = 20 } = {}) => {
  const query = {};
  if (status) {
    query.status = status;
  }
  if (severity) {
    query.severity = severity;
  }
  const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const incidents = await LogisticsIncident.find(query).sort({ reportDate: -1 }).limit(numericLimit);
  return incidents.map(toIncidentDto);
};

const updateIncidentStatus = async (identifier, nextStatus) => {
  if (!['abierta', 'en-proceso', 'resuelta', 'anulada'].includes(nextStatus)) {
    throw new AppError('Estado de incidencia inválido.', 422);
  }
  const incident = await findIncidentByIdentifier(identifier);
  if (!incident) {
    throw new AppError('Incidencia logística no encontrada.', 404);
  }

  incident.status = nextStatus;
  if (nextStatus === 'resuelta') {
    incident.resolutionDate = new Date();
    incident.changeHistory.push({
      action: 'Incidencia resuelta',
      description: 'Actualizada desde el panel logístico.',
      date: incident.resolutionDate,
      user: 'Panel Logística',
      type: 'resolved',
    });
  }
  if (nextStatus === 'anulada') {
    incident.resolutionDate = new Date();
    incident.changeHistory.push({
      action: 'Incidencia anulada',
      description: 'Actualizada desde el panel logístico.',
      date: incident.resolutionDate,
      user: 'Panel Logística',
      type: 'cancelled',
    });
  }
  if (nextStatus === 'en-proceso') {
    incident.changeHistory.push({
      action: 'Incidencia en proceso',
      description: 'Marcada como en investigación.',
      date: new Date(),
      user: 'Panel Logística',
      type: 'updated',
    });
  }

  await incident.save();
  return toIncidentDto(incident);
};

module.exports = {
  getIncident,
  listIncidents,
  updateIncidentStatus,
};
