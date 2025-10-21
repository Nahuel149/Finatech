const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    incomingAsset: {
      type: assetSchema,
      required: true,
    },
    outgoingAsset: {
      type: assetSchema,
      required: true,
    },
    subtype: {
      type: String,
      trim: true,
      required: true,
    },
    apr: {
      type: Number,
      required: true,
    },
    marketApr: {
      type: Number,
      required: true,
    },
    incomingAmount: {
      type: Number,
      required: true,
    },
    outgoingAmount: {
      type: Number,
      required: true,
    },
    marginPercentage: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'registered', 'completed', 'cancelled'],
      default: 'draft',
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    settlement: {
      mode: {
        type: String,
        enum: ['simple', 'compound'],
        default: 'simple',
      },
      simpleMethod: {
        type: String,
        trim: true,
      },
      lines: [
        new mongoose.Schema(
          {
            method: {
              type: String,
              trim: true,
              required: true,
            },
            allocationType: {
              type: String,
              enum: ['percentage', 'amount'],
              required: true,
            },
            value: {
              type: Number,
              required: true,
              min: 0,
            },
            computedPercentage: {
              type: Number,
              required: true,
              min: 0,
            },
          },
          { _id: false }
        ),
      ],
      totalPercentage: {
        type: Number,
        default: 0,
      },
      isComplete: {
        type: Boolean,
        default: false,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    operationCode: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ status: 1, currentStep: 1 });

transactionSchema.pre('validate', function applySettlementDefaults(next) {
  if (!this.settlement) {
    this.settlement = {};
  }
  if (!this.settlement.mode) {
    this.settlement.mode = 'simple';
  }
  if (!Array.isArray(this.settlement.lines)) {
    this.settlement.lines = [];
  }
  if (typeof this.settlement.totalPercentage !== 'number') {
    this.settlement.totalPercentage = this.settlement.mode === 'simple' ? 100 : 0;
  }
  if (typeof this.settlement.isComplete !== 'boolean') {
    this.settlement.isComplete = this.settlement.mode === 'simple';
  }
  next();
});

transactionSchema.index({ operationCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
