const { Router } = require('express');
const { body } = require('express-validator');
const { listClients, findClient, createClient, updateClient } = require('../controllers/client.controller');

const router = Router();

router.get('/', listClients);
router.get('/:id', findClient);
router.post(
  '/',
  [
    body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio.'),
    body('internalOwner').trim().notEmpty().withMessage('Indicá el responsable interno.'),
    body('contactType')
      .trim()
      .notEmpty()
      .withMessage('Seleccioná el tipo de contacto.')
      .bail()
      .isIn(['client', 'provider'])
      .withMessage('Tipo de contacto inválido.'),
    body('primaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
    body('secondaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
  ],
  createClient
);
router.put(
  '/:id',
  [
    body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio.'),
    body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio.'),
    body('internalOwner').trim().notEmpty().withMessage('Indicá el responsable interno.'),
    body('contactType')
      .trim()
      .notEmpty()
      .withMessage('Seleccioná el tipo de contacto.')
      .bail()
      .isIn(['client', 'provider'])
      .withMessage('Tipo de contacto inválido.'),
    body('primaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
    body('secondaryAddress').optional({ values: 'falsy' }).isObject().withMessage('Dirección inválida.'),
  ],
  updateClient
);

module.exports = router;
