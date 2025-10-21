const mongoose = require('mongoose');

const currentAccountBalanceSchema = new mongoose.Schema(
  {
    accountKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
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

currentAccountBalanceSchema.index({ accountKey: 1, currency: 1 }, { unique: true });

currentAccountBalanceSchema.pre('save', function roundAmount(next) {
  if (Number.isFinite(this.amount)) {
    this.amount = Math.round(Number(this.amount) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('CurrentAccountBalance', currentAccountBalanceSchema);
