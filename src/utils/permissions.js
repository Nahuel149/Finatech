const ADMIN_PERMISSION = 'admin:manage-permissions';

const MANAGED_PERMISSIONS = [
  'view-balances',
  'access-treasury',
  'access-transfers',
  'manage-treasury',
  'manage-notifications',
  'access-logistics',
  'manage-logistics',
  'treasury:receptions',
  'treasury:receptions:revert',
];

const normalizePermission = (permission) =>
  (typeof permission === 'string' ? permission.trim().toLowerCase() : '');

const dedupePermissions = (permissions = []) => {
  const normalized = Array.isArray(permissions)
    ? permissions.map(normalizePermission).filter(Boolean)
    : [];
  return Array.from(new Set(normalized));
};

module.exports = {
  ADMIN_PERMISSION,
  MANAGED_PERMISSIONS,
  normalizePermission,
  dedupePermissions,
};
