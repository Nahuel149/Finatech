const mongoose = require('mongoose');

const distributionLineSchema = new mongoose.Schema(
  {
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    method: {
      type: String,
      enum: ['ARS', 'USD'],
      default: 'ARS',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  { _id: false }
);

const transferOperationSchema = new mongoose.Schema(
  {
    operationCode: {
      type: String,
      trim: true,
    },
    movementType: {
      type: String,
      enum: ['cash', 'transfer'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['incoming', 'outgoing'],
      required: true,
    },
    currency: {
      type: String,
      default: 'ARS',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    distributionLines: {
      type: [distributionLineSchema],
      validate: {
        validator(lines) {
          if (!Array.isArray(lines) || lines.length === 0) {
            return false;
          }
          const sum = lines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
          const total = Number(this.totalAmount || 0);
          return Math.abs(sum - total) < 0.01;
        },
        message: 'Las asignaciones deben sumar exactamente el monto total.',
      },
    },
    status: {
      type: String,
      enum: ['registered'],
      default: 'registered',
    },
    confirmedAt: {
      type: Date,
      default: null,
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
  },
  {
    timestamps: true,
  }
);

transferOperationSchema.index({ movementType: 1, direction: 1, createdAt: -1 });
transferOperationSchema.index({ confirmedAt: -1 });
transferOperationSchema.index({ operationCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('TransferOperation', transferOperationSchema);
