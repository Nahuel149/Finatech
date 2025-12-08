const User = require('../models/User');
const AppError = require('../utils/AppError');
const {
  ADMIN_PERMISSION,
  MANAGED_PERMISSIONS,
  dedupePermissions,
  normalizePermission,
} = require('../utils/permissions');

const buildAdminUserPayload = (user) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  isVerified: user.isVerified,
  permissions: dedupePermissions(user.permissions || []),
  createdAt: user.createdAt,
});

const listUsers = async () => {
  const users = await User.find(
    {},
    'fullName email permissions isVerified createdAt',
  ).sort({ createdAt: -1, fullName: 1 });

  return users.map(buildAdminUserPayload);
};

const validateManagedPermissions = (permissions) => {
  const normalized = dedupePermissions(permissions);
  const invalid = normalized.filter((permission) => !MANAGED_PERMISSIONS.includes(permission));
  if (invalid.length > 0) {
    throw new AppError('Encontramos permisos invalidos en la solicitud.', 400, {
      code: 'INVALID_PERMISSIONS',
      details: { invalid },
    });
  }
  return normalized;
};

const updatePermissions = async ({ targetUserId, permissions, actingUserId }) => {
  if (!Array.isArray(permissions)) {
    throw new AppError('La lista de permisos debe ser un arreglo.', 400, {
      code: 'INVALID_PAYLOAD',
    });
  }

  const normalizedPermissions = validateManagedPermissions(permissions);

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new AppError('No encontramos el usuario solicitado.', 404, {
      code: 'USER_NOT_FOUND',
    });
  }

  const existingPermissions = dedupePermissions(user.permissions || []);
  const preservedPermissions = existingPermissions.filter(
    (permission) =>
      !MANAGED_PERMISSIONS.includes(normalizePermission(permission)) ||
      normalizePermission(permission) === ADMIN_PERMISSION
  );

  const nextPermissions = dedupePermissions([
    ...normalizedPermissions,
    ...preservedPermissions,
  ]);

  const actingId = actingUserId ? String(actingUserId) : null;
  const targetId = user._id.toString();
  const isSelf = actingId && actingId === targetId;

  const hadAdminPermission = existingPermissions.includes(ADMIN_PERMISSION);
  const keepsAdminPermission = nextPermissions.includes(ADMIN_PERMISSION);

  if (hadAdminPermission && !keepsAdminPermission) {
    if (isSelf) {
      throw new AppError('No podes quitar tu propio acceso de administracion.', 400, {
        code: 'CANNOT_REMOVE_SELF_ADMIN',
      });
    }

    const otherAdminExists = await User.exists({
      _id: { $ne: user._id },
      permissions: ADMIN_PERMISSION,
    });

    if (!otherAdminExists) {
      throw new AppError('Debe quedar al menos un administrador con acceso al panel.', 400, {
        code: 'LAST_ADMIN_REQUIRED',
      });
    }
  }

  user.permissions = nextPermissions;
  await user.save();

  return buildAdminUserPayload(user);
};

const getManagedPermissions = () => MANAGED_PERMISSIONS;

module.exports = {
  listUsers,
  updatePermissions,
  getManagedPermissions,
};
