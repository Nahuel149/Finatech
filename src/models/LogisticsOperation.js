const mongoose = require('mongoose');

const amountSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'ARS',
    },
  },
  { _id: false }
);

const timelineStepSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'current', 'completed'],
      default: 'pending',
    },
    author: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
      default: null,
    },
    url: {
      type: String,
      trim: true,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: 'fa-file',
    },
    color: {
      type: String,
      trim: true,
      default: 'text-primary',
    },
  },
  { _id: false }
);

const logisticsOperationSchema = new mongoose.Schema(
  {
    operationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['Entrega', 'Transferencia', 'Retiro', 'Custodia'],
      required: true,
    },
    state: {
      type: String,
      enum: ['pendiente', 'en-curso', 'completado', 'anulado'],
      default: 'pendiente',
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    origin: {
      type: String,
      trim: true,
      default: '',
    },
    destination: {
      type: String,
      trim: true,
      default: '',
    },
    routeDescription: {
      type: String,
      trim: true,
      default: '',
    },
    responsibleName: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: amountSchema,
      default: () => ({ value: null, currency: 'ARS' }),
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    timeline: {
      type: [timelineStepSchema],
      default: [],
    },
    metadata: {
      type: Map,
      of: String,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

logisticsOperationSchema.index({ scheduledAt: -1 });
logisticsOperationSchema.index({ state: 1, scheduledAt: -1 });
logisticsOperationSchema.index({ type: 1, scheduledAt: -1 });
logisticsOperationSchema.index({ contactName: 1 });
logisticsOperationSchema.index({ responsibleName: 1 });

module.exports = mongoose.model('LogisticsOperation', logisticsOperationSchema);
