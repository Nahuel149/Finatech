const mongoose = require('mongoose');

const treasuryBalanceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
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

treasuryBalanceSchema.index({ key: 1, currency: 1 }, { unique: true });

treasuryBalanceSchema.pre('save', function roundAmount(next) {
  if (Number.isFinite(this.amount)) {
    this.amount = Math.round(Number(this.amount) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('TreasuryBalance', treasuryBalanceSchema);
