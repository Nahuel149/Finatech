const mongoose = require('mongoose');

const twoFactorChallengeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    rememberMe: {
      type: Boolean,
      default: false,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
  }
);

twoFactorChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TwoFactorChallenge = mongoose.model('TwoFactorChallenge', twoFactorChallengeSchema);

module.exports = TwoFactorChallenge;
