const AppError = require('../utils/AppError');

const normalizePermission = (permission) =>
  (typeof permission === 'string' ? permission.trim() : '').toLowerCase();

const requirePermission = (permission) => {
  const normalized = normalizePermission(permission);
  if (!normalized) {
    throw new Error('Permission name is required');
  }

  return (req, _res, next) => {
    try {
      const permissions = Array.isArray(req.user?.permissions)
        ? req.user.permissions.map(normalizePermission)
        : [];

      if (!permissions.includes(normalized)) {
        throw new AppError('No tenés permisos suficientes para realizar esta acción.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requirePermission };
