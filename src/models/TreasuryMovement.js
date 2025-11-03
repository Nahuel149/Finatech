const mongoose = require('mongoose');

const movementOperationSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'model',
    },
    model: {
      type: String,
      enum: ['Transaction', 'TransferOperation'],
    },
    code: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    matchedAt: {
      type: Date,
    },
    matchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['registered', 'updated', 'compensated', 'cancelled'],
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
    notes: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const treasuryMovementSchema = new mongoose.Schema(
  {
    movementCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },
    medium: {
      type: String,
      enum: ['cash', 'transfer', 'deposit'],
      required: true,
    },
    currency: {
      type: String,
      enum: ['ARS', 'USD'],
      required: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    movementAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['registered', 'compensated', 'cancelled'],
      default: 'registered',
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    reference: {
      type: String,
      trim: true,
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'operation', 'system'],
      default: 'manual',
    },
    balanceKey: {
      type: String,
      enum: ['cash', 'transfers', 'usd'],
      required: true,
    },
    linkedOperations: {
      type: [movementOperationSchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    compensatedAt: {
      type: Date,
      default: null,
    },
    compensatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
    },
    auditTrail: {
      type: [auditLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

treasuryMovementSchema.index({ movementCode: 1 }, { unique: true });
treasuryMovementSchema.index({ movementAt: -1 });
treasuryMovementSchema.index({ status: 1, movementAt: -1 });
treasuryMovementSchema.index({ currency: 1, movementAt: -1 });
treasuryMovementSchema.index({ medium: 1, movementAt: -1 });
treasuryMovementSchema.index({ contact: 1, movementAt: -1 });
// Added compound index to optimize common filtering combinations (currency, type, movementAt)
treasuryMovementSchema.index({ currency: 1, type: 1, movementAt: -1 });
// Added text index for efficient searching across multiple text fields
treasuryMovementSchema.index(
  { movementCode: 'text', reference: 'text', description: 'text', 'linkedOperations.code': 'text' },
  { name: 'MovementTextIndex' }
);

treasuryMovementSchema.pre('validate', function assignBalanceKey(next) {
  if (!this.balanceKey) {
    if (this.currency === 'USD') {
      this.balanceKey = 'usd';
    } else if (this.medium === 'cash') {
      this.balanceKey = 'cash';
    } else {
      this.balanceKey = 'transfers';
    }
  }
  next();
});

treasuryMovementSchema.pre('save', function roundAmount(next) {
  if (Number.isFinite(this.amount)) {
    this.amount = Math.round(Number(this.amount) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('TreasuryMovement', treasuryMovementSchema);
