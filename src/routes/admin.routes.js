const { Router } = require('express');
const { body, param } = require('express-validator');
const { getUsers, getPermissions, updateUserPermissions } = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { validateRequest } = require('../middleware/validateRequest');
const { ADMIN_PERMISSION, MANAGED_PERMISSIONS } = require('../utils/permissions');

const router = Router();

router.use(requireAuth);
router.use(requirePermission(ADMIN_PERMISSION));

router.get('/permissions', getPermissions);
router.get('/users', getUsers);

router.put(
  '/users/:userId/permissions',
  [
    param('userId').isMongoId().withMessage('ID de usuario invalido.'),
    body('permissions')
      .isArray({ min: 0 })
      .withMessage('La lista de permisos debe ser un arreglo.')
      .custom((permissions) => permissions.every((permission) => typeof permission === 'string'))
      .withMessage('Todos los permisos deben ser cadenas.'),
    body('permissions').custom((permissions) => {
      const normalized = permissions.map((permission) =>
        typeof permission === 'string' ? permission.trim().toLowerCase() : ''
      );
      const invalid = normalized.filter((permission) => permission && !MANAGED_PERMISSIONS.includes(permission));
      if (invalid.length > 0) {
        throw new Error(`Permisos invalidos: ${invalid.join(', ')}`);
      }
      return true;
    }),
  ],
  validateRequest,
  updateUserPermissions,
);

module.exports = router;
