const AppError = require('../utils/AppError');

const normalizePermission = (permission) =>
  (typeof permission === 'string' ? permission.trim() : '').toLowerCase();

const toPermissionList = (permission) => {
  if (Array.isArray(permission)) {
    return permission
      .map(normalizePermission)
      .filter(Boolean);
  }
  const normalized = normalizePermission(permission);
  return normalized ? [normalized] : [];
};

const requirePermission = (permission) => {
  const required = toPermissionList(permission);
  if (required.length === 0) {
    throw new Error('Permission name is required');
  }

  return (req, _res, next) => {
    try {
      const permissions = Array.isArray(req.user?.permissions)
        ? req.user.permissions.map(normalizePermission)
        : [];

      const hasPermission = required.some((perm) => permissions.includes(perm));

      if (!hasPermission) {
        throw new AppError('No tenés permisos suficientes para realizar esta acción.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requirePermission };
