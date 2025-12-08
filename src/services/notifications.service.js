const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const ALLOWED_SEVERITIES = new Set(['info', 'success', 'warning', 'error']);
const DEFAULT_DEDUPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const normalizeSeverity = (severity = 'info') =>
  ALLOWED_SEVERITIES.has(severity) ? severity : 'info';

const normalizeRecipients = (recipients) => {
  if (!Array.isArray(recipients)) {
    return [];
  }

  return recipients
    .map((recipient) => {
      const userId = recipient?.user;
      const role = recipient?.role ? String(recipient.role).trim() || null : null;

      const normalizedUser =
        userId && mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null;

      if (!normalizedUser && !role) {
        return null;
      }

      return {
        user: normalizedUser,
        role,
      };
    })
    .filter(Boolean);
};

const normalizeContext = (context) => {
  if (!context) {
    return null;
  }

  const type = context.type ? String(context.type).trim() || null : null;
  const id = context.id ? String(context.id).trim() || null : null;
  const path = context.path ? String(context.path).trim() || null : null;
  const hasData = Boolean(type || id || path || context.extra);

  if (!hasData) {
    return null;
  }

  return {
    type,
    id,
    path,
    extra: context.extra ?? null,
  };
};

const buildDedupeQuery = ({ title, message, context, windowMs }) => {
  const now = Date.now();
  const threshold = new Date(now - windowMs);
  const query = {
    title,
    message,
    createdAt: { $gte: threshold },
  };

  if (context?.type) {
    query['context.type'] = context.type;
  }
  if (context?.id) {
    query['context.id'] = context.id;
  }

  return query;
};

const emitNotification = async ({
  title,
  message,
  severity = 'info',
  actionLabel = null,
  actionUrl = null,
  metadata = null,
  recipients = [],
  context = null,
  dedupeWindowMs = DEFAULT_DEDUPE_WINDOW_MS,
} = {}) => {
  if (!title || !message) {
    throw new Error('Title and message are required to emit a notification.');
  }

  const normalizedRecipients = normalizeRecipients(recipients);
  const normalizedContext = normalizeContext(context);
  const normalizedSeverity = normalizeSeverity(severity);

  try {
    const existing = await Notification.findOne(
      buildDedupeQuery({
        title,
        message,
        context: normalizedContext,
        windowMs: dedupeWindowMs,
      })
    ).lean();

    if (existing) {
      return existing;
    }

    const created = await Notification.create({
      title,
      message,
      severity: normalizedSeverity,
      actionLabel: actionLabel || null,
      actionUrl: actionUrl || null,
      metadata: metadata || null,
      recipients: normalizedRecipients,
      context: normalizedContext,
    });

    return created.toObject ? created.toObject() : created;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('No se pudo emitir la notificación', error);
    return null;
  }
};

const emitToUsers = async (userIds = [], payload = {}) => {
  const recipients = Array.isArray(userIds)
    ? userIds.map((id) => ({ user: id }))
    : [];
  return emitNotification({ ...payload, recipients });
};

module.exports = {
  emitNotification,
  emitToUsers,
};
