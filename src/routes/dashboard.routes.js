const { Router } = require('express');
const { getTreasuryBalances } = require('../services/treasury.service');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { subscribeBalanceUpdated } = require('../utils/eventBus');

const router = Router();

router.get(
  '/balances',
  requireAuth,
  requirePermission('view-balances'),
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
  requirePermission('view-balances'),
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

router.get('/notifications', requireAuth, (_req, res) => {
  const now = new Date();
  const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

  res.json({
    notifications: [
      {
        id: 'notif-001',
        title: 'Operación completada',
        message: 'La operación #OP-2041 se registró exitosamente.',
        createdAt: minutesAgo(5),
        read: false,
      },
      {
        id: 'notif-002',
        title: 'Liquidación pendiente',
        message: 'Liquidación LQ-9033 requiere tu revisión.',
        createdAt: minutesAgo(18),
        read: false,
      },
      {
        id: 'notif-003',
        title: 'Alerta de liquidez',
        message: 'La cuenta USD Nación se acerca al mínimo operativo.',
        createdAt: minutesAgo(42),
        read: false,
      },
      {
        id: 'notif-004',
        title: 'Nueva documentación',
        message: 'Cliente Gamma adjuntó documentación para validación.',
        createdAt: minutesAgo(120),
        read: true,
      },
    ],
  });
});

module.exports = router;
