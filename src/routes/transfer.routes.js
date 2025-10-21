const { Router } = require('express');
const { body } = require('express-validator');
const {
  createTransferOperation,
  fetchTransferOperation,
  listTransferOperations,
} = require('../controllers/transfer.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { validateRequest } = require('../middleware/validateRequest');

const router = Router();

router.post(
  '/pesos',
  requireAuth,
  body('movementType')
    .isIn(['cash', 'transfer'])
    .withMessage('Seleccioná si la operación es en efectivo o transferencia.'),
  body('direction')
    .isIn(['incoming', 'outgoing'])
    .withMessage('Indicá si la operación es entrante o saliente.'),
  body('totalAmount')
    .isFloat({ gt: 0 })
    .withMessage('Ingresá un monto total válido, mayor a 0.'),
  body('distributionLines')
    .isArray({ min: 1 })
    .withMessage('Agregá al menos una línea de distribución.'),
  body('distributionLines.*.contactId')
    .isMongoId()
    .withMessage('Cada línea debe tener un contacto válido.'),
  body('distributionLines.*.method')
    .optional()
    .isIn(['ARS', 'USD'])
    .withMessage('El método debe ser ARS o USD.'),
  body('distributionLines.*.amount')
    .isFloat({ gt: 0 })
    .withMessage('Los montos asignados deben ser mayores a 0.'),
  validateRequest,
  createTransferOperation
);

router.get('/pesos', requireAuth, listTransferOperations);

router.get('/pesos/:id', requireAuth, fetchTransferOperation);

module.exports = router;
