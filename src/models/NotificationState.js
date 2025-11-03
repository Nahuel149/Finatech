const mongoose = require('mongoose');

const notificationStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    notificationId: {
      type: String,
      required: true,
    },
    readAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

notificationStateSchema.index({ user: 1, notificationId: 1 }, { unique: true });

const NotificationState = mongoose.model('NotificationState', notificationStateSchema);

module.exports = NotificationState;
