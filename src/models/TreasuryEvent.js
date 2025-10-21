const mongoose = require('mongoose');

const treasuryEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['current_account_update', 'weighted_average_update'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    operation: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'TransferOperation',
      },
      code: {
        type: String,
        required: true,
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
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0.01,
      },
      distributionSummary: [
        new mongoose.Schema(
          {
            contact: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Client',
              required: true,
            },
            method: {
              type: String,
              enum: ['ARS', 'USD'],
              required: true,
            },
            amount: {
              type: Number,
              required: true,
              min: 0.01,
            },
          },
          { _id: false }
        ),
      ],
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

treasuryEventSchema.index({ type: 1, status: 1, createdAt: 1 });
treasuryEventSchema.index({ 'operation.id': 1, type: 1 });

module.exports = mongoose.model('TreasuryEvent', treasuryEventSchema);
