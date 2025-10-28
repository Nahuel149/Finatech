const mongoose = require('mongoose');

const marketRateOverrideSchema = new mongoose.Schema(
  {
    baseAsset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quoteAsset: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      enum: ['MANUAL'],
      default: 'MANUAL',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

marketRateOverrideSchema.index({ baseAsset: 1, quoteAsset: 1, validFrom: -1 });

module.exports = mongoose.model('MarketRateOverride', marketRateOverrideSchema);
