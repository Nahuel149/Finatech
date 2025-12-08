const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    actionLabel: {
      type: String,
      trim: true,
      default: null,
    },
    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    recipients: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          trim: true,
          default: null,
        },
      },
    ],
    context: {
      type: {
        type: String,
        trim: true,
        default: null,
      },
      id: {
        type: String,
        trim: true,
        default: null,
      },
      path: {
        type: String,
        trim: true,
        default: null,
      },
      extra: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });
notificationSchema.index({ 'context.type': 1, 'context.id': 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
