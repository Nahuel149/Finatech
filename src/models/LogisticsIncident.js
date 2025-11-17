const mongoose = require('mongoose');

const incidentDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    type: { type: String, trim: true, default: 'documento' },
    size: { type: String, trim: true, default: null },
    url: { type: String, trim: true, default: null },
    uploadedBy: { type: String, trim: true, default: null },
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, trim: true, default: 'Activo' },
  },
  { _id: true }
);

const incidentItemSchema = new mongoose.Schema(
  {
    code: { type: String, trim: true },
    description: { type: String, trim: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: null },
    status: { type: String, trim: true, default: 'affected' },
    location: { type: String, trim: true, default: null },
  },
  { _id: true }
);

const incidentHistorySchema = new mongoose.Schema(
  {
    action: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: null },
    date: { type: Date, default: Date.now },
    user: { type: String, trim: true, default: 'Sistema' },
    type: {
      type: String,
      enum: ['created', 'updated', 'in_review', 'comment', 'resolved', 'cancelled'],
      default: 'updated',
    },
  },
  { _id: true }
);

const logisticsIncidentSchema = new mongoose.Schema(
  {
    incidentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['abierta', 'en-proceso', 'resuelta', 'anulada'],
      default: 'abierta',
      index: true,
    },
    severity: {
      type: String,
      enum: ['baja', 'media', 'alta', 'critica'],
      default: 'media',
    },
    type: {
      type: String,
      trim: true,
      default: 'Incidente',
    },
    reportDate: { type: Date, default: Date.now },
    resolutionDate: { type: Date, default: null },
    responsible: { type: String, trim: true, default: null },
    reportedBy: { type: String, trim: true, default: null },
    associatedMovement: { type: String, trim: true, default: null },
    logisticsOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LogisticsOrder',
      default: null,
    },
    description: { type: String, trim: true, default: '' },
    operationalImpacts: {
      type: [String],
      default: [],
    },
    involvedItems: {
      type: [incidentItemSchema],
      default: [],
    },
    attachedDocuments: {
      type: [incidentDocumentSchema],
      default: [],
    },
    changeHistory: {
      type: [incidentHistorySchema],
      default: [],
    },
    resolutionDetails: {
      type: {
        resolutionType: { type: String, trim: true, default: null },
        resolutionDescription: { type: String, trim: true, default: null },
        resolvedBy: { type: String, trim: true, default: null },
        resolutionDate: { type: Date, default: null },
        followUpActions: { type: [String], default: [] },
      },
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LogisticsIncident', logisticsIncidentSchema);
