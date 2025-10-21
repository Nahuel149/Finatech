const { Router } = require('express');
const { getTreasuryBalances } = require('../services/treasury.service');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');

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
