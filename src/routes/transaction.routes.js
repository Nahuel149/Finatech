const { Router } = require('express');
const { body } = require('express-validator');
const {
  createDraft,
  getDraft,
  updateDraftData,
  updateSettlement,
  advanceDraftStep,
  finalizeDraft,
  voidDraft,
} = require('../controllers/transaction.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { validateRequest } = require('../middleware/validateRequest');

const router = Router();

const assetValidators = (prefix) => [
  body(`${prefix}.code`).isString().trim().notEmpty().withMessage('Asset code is required'),
  body(`${prefix}.label`).isString().trim().notEmpty().withMessage('Asset label is required'),
];

router.post(
  '/draft',
  requireAuth,
  body('clientId').isString().notEmpty().withMessage('Client is required'),
  body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
  ...assetValidators('incomingAsset'),
  ...assetValidators('outgoingAsset'),
  body('apr').isFloat().withMessage('APR is required'),
  body('marketApr').isFloat().withMessage('Market APR is required'),
  body('incomingAmount').isFloat({ gt: 0 }).withMessage('Incoming amount must be greater than 0'),
  body('outgoingAmount').isFloat({ gt: 0 }).withMessage('Outgoing amount must be greater than 0'),
  validateRequest,
  createDraft
);

router.put(
  '/draft/:id',
  requireAuth,
  body('clientId').isString().notEmpty().withMessage('Client is required'),
  body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
  ...assetValidators('incomingAsset'),
  ...assetValidators('outgoingAsset'),
  body('apr').isFloat().withMessage('APR is required'),
  body('marketApr').isFloat().withMessage('Market APR is required'),
  body('incomingAmount').isFloat({ gt: 0 }).withMessage('Incoming amount must be greater than 0'),
  body('outgoingAmount').isFloat({ gt: 0 }).withMessage('Outgoing amount must be greater than 0'),
  validateRequest,
  updateDraftData
);

router.put(
  '/draft/:id/settlement',
  requireAuth,
  body('mode').optional().isIn(['simple', 'compound']).withMessage('El tipo de liquidación es inválido'),
  body('simpleMethod')
    .if((value, { req }) => (req.body.mode || 'simple') === 'simple')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Indicá el método de liquidación'),
  body('lines')
    .if((value, { req }) => (req.body.mode || 'simple') === 'compound')
    .isArray({ min: 1 })
    .withMessage('Agregá al menos una línea de liquidación'),
  body('lines.*.method')
    .if((value, { req }) => (req.body.mode || 'simple') === 'compound')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Cada línea debe indicar un método'),
  body('lines.*.allocationType')
    .if((value, { req }) => (req.body.mode || 'simple') === 'compound')
    .isIn(['percentage', 'amount'])
    .withMessage('El tipo de asignación debe ser porcentaje o monto'),
  body('lines.*.value')
    .if((value, { req }) => (req.body.mode || 'simple') === 'compound')
    .isFloat({ gt: 0 })
    .withMessage('Las líneas deben tener un valor mayor a 0'),
  validateRequest,
  updateSettlement
);

router.patch(
  '/draft/:id/step',
  requireAuth,
  body('step').isInt({ min: 1, max: 3 }).withMessage('Paso inválido.'),
  validateRequest,
  advanceDraftStep
);

router.post('/draft/:id/finalize', requireAuth, finalizeDraft);

router.post(
  '/:id/void',
  requireAuth,
  body('reason').optional().isString().trim().isLength({ max: 500 }).withMessage('El motivo debe tener hasta 500 caracteres.'),
  validateRequest,
  voidDraft
);

router.get('/:id', requireAuth, getDraft);

module.exports = router;
