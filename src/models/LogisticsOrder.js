const mongoose = require('mongoose');

const itemMetadataSchema = new mongoose.Schema(
  {
    bank: { type: String, trim: true },
    number: { type: String, trim: true },
    dueDate: { type: Date, default: null },
    metalType: { type: String, trim: true },
    purity: { type: String, trim: true },
    weight: { type: Number, min: 0 },
    description: { type: String, trim: true },
    extra: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false, strict: false }
);

const logisticsOrderItemSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    assetType: {
      type: String,
      enum: ['CURRENCY', 'CHEQUE', 'METAL', 'OTHER'],
      default: 'CURRENCY',
    },
    expectedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    metadata: {
      type: itemMetadataSchema,
      default: () => ({}),
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    receivedAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    pendingAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    discrepancyFlag: {
      type: Boolean,
      default: false,
    },
    discrepancyReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: true, timestamps: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    metadata: {
      fileName: { type: String, trim: true },
      gpsLat: { type: Number },
      gpsLng: { type: Number },
      note: { type: String, trim: true },
    },
  },
  { _id: true }
);

const treasuryReceptionEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'recepcion.pendiente',
        'recepcion.confirmada',
        'recepcion.omitida',
        'recepcion.revertida',
      ],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    userName: {
      type: String,
      trim: true,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    ip: {
      type: String,
      trim: true,
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      default: null,
    },
    totalsByCurrency: [
      {
        currency: { type: String, trim: true },
        amount: { type: Number, default: 0 },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: true }
);

const operationAssetSnapshotSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      required: true,
    },
    label: {
      type: String,
      trim: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const logisticsOrderSchema = new mongoose.Schema(
  {
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    operationModel: {
      type: String,
      enum: ['Transaction', 'TransferOperation'],
      default: 'Transaction',
    },
    operationType: {
      type: String,
      trim: true,
      default: null,
    },
    operationCode: {
      type: String,
      required: true,
      trim: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orderYear: {
      type: Number,
      required: true,
      index: true,
    },
    orderSequence: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ['RETIRO', 'ENTREGA'],
      required: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    windowStart: {
      type: Date,
      required: true,
    },
    windowEnd: {
      type: Date,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'BORRADOR',
        'PROGRAMADA',
        'ASIGNADA',
        'EN_CAMINO',
        'EN_SITIO',
        'COMPLETADA',
        'COMPLETADA_TOTAL',
        'COMPLETADA_PARCIAL',
        'DISCREPANCIA',
        'CANCELADA',
      ],
      default: 'BORRADOR',
      index: true,
    },
    items: {
      type: [logisticsOrderItemSchema],
      default: [],
      validate: [(value) => Array.isArray(value) && value.length > 0, 'Debés cargar al menos un ítem.'],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    internalNotes: {
      type: String,
      trim: true,
      default: null,
    },
    messenger: {
      type: String,
      trim: true,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    liquidationPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    operationSnapshot: {
      type: [operationAssetSnapshotSchema],
      default: [],
    },
    clientSnapshot: {
      type: new mongoose.Schema(
        {
          id: { type: String, trim: true },
          fullName: { type: String, trim: true },
          shortName: { type: String, trim: true },
          contactType: { type: String, trim: true },
          phone: { type: String, trim: true },
          email: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
    updatedByName: {
      type: String,
      trim: true,
    },
    requiredEvidences: {
      type: [String],
      default: [],
    },
    evidences: {
      type: [evidenceSchema],
      default: [],
    },
    geofenceOK: {
      type: Boolean,
      default: false,
    },
    startedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    receiptId: { type: String, trim: true, default: null },
    receiptUrl: { type: String, trim: true, default: null },
    treasuryReceptionStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'omitted'],
      default: null,
      index: true,
    },
    treasuryReception: {
      closedWithoutAccountingImpact: { type: Boolean, default: false },
      events: {
        type: [treasuryReceptionEventSchema],
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

logisticsOrderSchema.index({ operationId: 1, createdAt: -1 });
logisticsOrderSchema.index({ status: 1, windowStart: 1 });

module.exports = mongoose.model('LogisticsOrder', logisticsOrderSchema);
