const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { validateRequest } = require('../middleware/validateRequest');
const { saveManualMarketRate, getLatestMarketRate } = require('../services/marketRate.service');

const router = Router();

router.put(
  '/market',
  requireAuth,
  requirePermission('manage-market-rates'),
  body('baseAsset').isString().trim().notEmpty().withMessage('Indicá el activo base.'),
  body('quoteAsset').isString().trim().notEmpty().withMessage('Indicá el activo de referencia.'),
  body('rate').isFloat({ gt: 0 }).withMessage('Ingresá una tasa válida mayor a 0.'),
  body('validFrom').optional().isISO8601().withMessage('La fecha de vigencia es inválida.'),
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

router.get('/market', requireAuth, async (req, res, next) => {
  try {
    const baseAsset = req.query.baseAsset || 'USD';
    const quoteAsset = req.query.quoteAsset || 'ARS';
    const override = await getLatestMarketRate({
      baseAsset,
      quoteAsset,
    });
    res.json({ override });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
