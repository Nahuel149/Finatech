const mongoose = require('mongoose');

const operationReferenceSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    code: {
      type: String,
      trim: true,
      default: null,
    },
    type: {
      type: String,
      trim: true,
      default: null,
    },
    source: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

const counterpartSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      default: null,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    key: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

const currentAccountMovementSchema = new mongoose.Schema(
  {
    ledger: {
      type: String,
      enum: ['general', 'contact'],
      required: true,
    },
    accountKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    stage: {
      type: String,
      enum: ['registration', 'settlement'],
      required: true,
    },
    operation: {
      type: operationReferenceSchema,
      default: () => ({}),
    },
    counterpart: {
      type: counterpartSchema,
      default: () => ({}),
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

currentAccountMovementSchema.index({ ledger: 1, currency: 1, createdAt: -1 });
currentAccountMovementSchema.index({ 'operation.id': 1, ledger: 1 });
currentAccountMovementSchema.index({ contact: 1, currency: 1, createdAt: -1 });

module.exports = mongoose.model('CurrentAccountMovement', currentAccountMovementSchema);
