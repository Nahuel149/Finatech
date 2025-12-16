const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { validateRequest } = require('../middleware/validateRequest');
const {
  saveManualMarketRate,
  getLatestMarketRate,
  fetchOfficialUsdArsRate,
} = require('../services/marketRate.service');
const { sendCached } = require('../utils/responseCache');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const router = Router();

router.put(
  '/market',
  requireAuth,
  requirePermission('manage-market-rates'),
  body('baseAsset').isString().trim().notEmpty().withMessage('Indicǭ el activo base.'),
  body('quoteAsset').isString().trim().notEmpty().withMessage('Indicǭ el activo de referencia.'),
  body('buyRate').isFloat({ gt: 0 }).withMessage('La compra debe ser mayor a 0.'),
  body('sellRate').isFloat({ gt: 0 }).withMessage('La venta debe ser mayor a 0.'),
  validateRequest,
  async (req, res, next) => {
    try {
      const context = {
        userId: req.user?._id || req.user?.id || null,
      };
      const override = await saveManualMarketRate({
        ...req.body,
        userId: context.userId,
      });
      res.json({ override });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/market/official',
  requireAuth,
  // Allow broader access so wizard users without balances can still fetch the fallback
  requirePermission(['manage-market-rates', 'view-balances', 'access-transfers', 'access-treasury']),
  async (_req, res, next) => {
    try {
      const quote = await fetchOfficialUsdArsRate();
      res.json({ quote });
    } catch (error) {
      next(error);
    }
  }
);

// Read limiter to mitigate loops on market rate reads
const marketLimiter = rateLimit({
  windowMs: 3000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?._id || req.user?.id;
    const baseAsset = req.query.baseAsset || 'USD';
    const quoteAsset = req.query.quoteAsset || 'ARS';
    const userKey = userId ? String(userId) : ipKeyGenerator(req.ip);
    return `${userKey}:rates:market:${baseAsset}:${quoteAsset}`;
  },
  message: {
    message: 'Demasiadas solicitudes de tasa de mercado en poco tiempo.',
    code: 'RATE_LIMIT_MARKET',
  },
});

router.get('/market', requireAuth, marketLimiter, async (req, res, next) => {
  try {
    const baseAsset = req.query.baseAsset || 'USD';
    const quoteAsset = req.query.quoteAsset || 'ARS';

    const key = `rates:market:${baseAsset}:${quoteAsset}`;
    await sendCached({
      req,
      res,
      key,
      ttlMs: 30 * 1000,
      compute: async () => {
        const override = await getLatestMarketRate({ baseAsset, quoteAsset });
        return { override };
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
