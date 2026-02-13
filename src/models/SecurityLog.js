const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: [
        'registration',
        'verification',
        'login',
        'two_factor',
        'two_factor_toggle',
        'resend_verification',
        'password_reset',
      ],
      required: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending_verification',
        'verified',
        'merged',
        'duplicate_verified',
        'login_success',
        'login_failure',
        'account_locked',
        'two_factor_required',
        'two_factor_bypassed',
        'two_factor_verified',
        'two_factor_failed',
        'two_factor_enabled',
        'two_factor_disabled',
        'verification_resent',
        'reset_requested',
        'reset_completed',
        'reset_invalid',
        'error',
      ],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

module.exports = SecurityLog;
