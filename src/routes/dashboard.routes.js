const mongoose = require('mongoose');
const { Router } = require('express');
const { body, param } = require('express-validator');
const { getTreasuryBalances } = require('../services/treasury.service');
const { listRecentOperations } = require('../services/dashboard.service');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { validateRequest } = require('../middleware/validateRequest');
const { subscribeBalanceUpdated } = require('../utils/eventBus');
const Notification = require('../models/Notification');
const NotificationState = require('../models/NotificationState');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const router = Router();
const VIEW_BALANCES_PERMISSIONS = ['view-balances', 'access-treasury'];

const PLACEHOLDER_NOTIFICATION_SIGNATURES = new Set([
  'Operación completada|La operación #OP-2041 se registró exitosamente.',
  'Liquidación pendiente|Liquidación LQ-9033 requiere tu revisión.',
  'Alerta de liquidez|La cuenta USD Nación se acerca al mínimo operativo.',
  'Nueva documentación|Cliente Gamma adjuntó documentación para validación.',
]);

const buildRecipientFilter = (userId) => {
  if (!userId) {
    return {};
  }

  return {
    $or: [
      { recipients: { $exists: false } },
      { recipients: { $size: 0 } },
      { recipients: null },
      { 'recipients.user': userId },
    ],
  };
};

const formatNotification = (notification, readSet = new Set()) => {
  const id = notification._id.toString();
  return {
    id,
    title: notification.title,
    message: notification.message,
    description: notification.message,
    severity: notification.severity,
    actionLabel: notification.actionLabel,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    read: readSet.has(id),
  };
};

router.get(
  '/balances',
  requireAuth,
  requirePermission(VIEW_BALANCES_PERMISSIONS),
  async (_req, res, next) => {
    try {
      const balances = await getTreasuryBalances();
      res.json({ balances });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/balances/events',
  requireAuth,
  requirePermission(VIEW_BALANCES_PERMISSIONS),
  (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    } else {
      res.write('\n');
    }

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    };

    const send = (payload) => {
      try {
        res.write(`event: balance-update\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (error) {
        // If the client disconnects while writing, silently stop streaming.
        cleanup();
      }
    };

    const sendHeartbeat = () => {
      try {
        res.write(': keep-alive\n\n');
      } catch (error) {
        cleanup();
      }
    };

    const unsubscribe = subscribeBalanceUpdated((payload) => {
      send({
        ...payload,
        type: 'balance-update',
      });
    });

    const heartbeat = setInterval(sendHeartbeat, 30000);

    send({
      type: 'connected',
      timestamp: new Date().toISOString(),
    });

    req.on('close', cleanup);
    req.on('error', cleanup);
  }
);

router.get(
  '/operations/recent',
  requireAuth,
  requirePermission('view-balances'),
  async (req, res, next) => {
    try {
      const limit = Number(req.query.limit);
      const page = Number(req.query.page);
      const result = await listRecentOperations({ limit, page });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Tight read limiter to mitigate rapid refresh loops on notifications
const notificationsLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?._id || req.user?.id;
    const userKey = userId ? String(userId) : ipKeyGenerator(req.ip);
    return `${userKey}:notifications`;
  },
  message: {
    message: 'Demasiadas solicitudes a notificaciones en poco tiempo.',
    code: 'RATE_LIMIT_NOTIFICATIONS',
  },
});

const notificationBaseValidators = [
  body('title').isString().trim().notEmpty().withMessage('El título es obligatorio.'),
  body('message').isString().trim().notEmpty().withMessage('La descripción es obligatoria.'),
  body('severity')
    .optional()
    .isIn(['info', 'success', 'warning', 'error'])
    .withMessage('La severidad es inválida.'),
  body('actionLabel')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('La etiqueta de acción es demasiado larga.'),
  body('actionUrl')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1024 })
    .withMessage('La URL de acción es demasiado larga.'),
  body('metadata')
    .optional()
    .custom((value, { req }) => {
      if (typeof value === 'string') {
        try {
          req.body.metadata = JSON.parse(value);
          return true;
        } catch (error) {
          throw new Error('El metadata debe ser un objeto JSON válido.');
        }
      }
      if (typeof value === 'object' && value !== null) {
        return true;
      }
      throw new Error('El metadata debe ser un objeto.');
    }),
];

router.get('/notifications', requireAuth, notificationsLimiter, async (req, res, next) => {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
    const includeRead = req.query.includeRead !== 'false';
    const since = req.query.since ? new Date(req.query.since) : null;
    const recipientFilter = buildRecipientFilter(req.user?._id);

    const match = { ...recipientFilter };
    if (since && !Number.isNaN(since.getTime())) {
      match.createdAt = { $gt: since };
    }

    const notifications = await Notification.find(match)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    const sanitizedNotifications = notifications.filter(
      (notification) =>
        !PLACEHOLDER_NOTIFICATION_SIGNATURES.has(
          `${notification.title}|${notification.message}`
        )
    );

    const ids = sanitizedNotifications.map((notification) => notification._id.toString());
    let readSet = new Set();
    if (ids.length > 0) {
      const readStates = await NotificationState.find({
        user: req.user._id,
        notificationId: { $in: ids },
      })
        .lean()
        .exec();
      readSet = new Set(readStates.map((state) => state.notificationId));
    }

    let payload = sanitizedNotifications.map((notification) => formatNotification(notification, readSet));
    if (!includeRead) {
      payload = payload.filter((notification) => !notification.read);
    }

    res.json({ notifications: payload });
  } catch (error) {
    next(error);
  }
});

router.post('/notifications/:id/read', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'El identificador de la notificación es obligatorio.' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Identificador inválido.' });
    }

    const recipientFilter = buildRecipientFilter(req.user?._id);
    const notification = await Notification.findOne({ _id: id, ...recipientFilter }).lean();
    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada.' });
    }

    await NotificationState.findOneAndUpdate(
      { user: req.user._id, notificationId: id },
      { $set: { readAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/notifications/read-all', requireAuth, async (req, res, next) => {
  try {
    const recipientFilter = buildRecipientFilter(req.user?._id);
    const notifications = await Notification.find(recipientFilter, { _id: 1 }).lean().exec();
    if (!notifications || !notifications.length) {
      return res.json({ success: true });
    }

    const bulkOperations = notifications.map((notification) => ({
      updateOne: {
        filter: {
          user: req.user._id,
          notificationId: notification._id.toString(),
        },
        update: {
          $set: {
            readAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await NotificationState.bulkWrite(bulkOperations, { ordered: false });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/notifications',
  requireAuth,
  requirePermission('manage-notifications'),
  notificationBaseValidators,
  validateRequest,
  async (req, res, next) => {
    try {
      const { title, message, severity = 'info', actionLabel = null, actionUrl = null, metadata = null } = req.body;

      const notification = await Notification.create({
        title,
        message,
        severity,
        actionLabel,
        actionUrl,
        metadata,
        createdBy: req.user._id,
      });

      res.status(201).json({ notification: formatNotification(notification) });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/notifications/:id',
  requireAuth,
  requirePermission('manage-notifications'),
  param('id').isMongoId().withMessage('Identificador inválido.'),
  body('title').optional().isString().trim().notEmpty().withMessage('El título no puede estar vacío.'),
  body('message').optional().isString().trim().notEmpty().withMessage('La descripción no puede estar vacía.'),
  body('severity')
    .optional()
    .isIn(['info', 'success', 'warning', 'error'])
    .withMessage('La severidad es inválida.'),
  body('actionLabel')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('La etiqueta de acción es demasiado larga.'),
  body('actionUrl')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1024 })
    .withMessage('La URL de acción es demasiado larga.'),
  body('metadata')
    .optional()
    .custom((value, { req }) => {
      if (typeof value === 'string') {
        try {
          req.body.metadata = JSON.parse(value);
          return true;
        } catch (error) {
          throw new Error('El metadata debe ser un objeto JSON válido.');
        }
      }
      if (typeof value === 'object' && value !== null) {
        return true;
      }
      throw new Error('El metadata debe ser un objeto.');
    }),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const update = {};
      const allowedFields = ['title', 'message', 'severity', 'actionLabel', 'actionUrl', 'metadata'];
      allowedFields.forEach((field) => {
        if (field in req.body) {
          update[field] = req.body[field];
        }
      });

      const notification = await Notification.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!notification) {
        return res.status(404).json({ message: 'Notificación no encontrada.' });
      }

      res.json({ notification: formatNotification(notification) });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/notifications/:id',
  requireAuth,
  requirePermission('manage-notifications'),
  param('id').isMongoId().withMessage('Identificador inválido.'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByIdAndDelete(id);

      if (!notification) {
        return res.status(404).json({ message: 'Notificación no encontrada.' });
      }

      await NotificationState.deleteMany({ notificationId: id });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
