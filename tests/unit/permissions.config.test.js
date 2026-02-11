const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { ADMIN_PERMISSION, MANAGED_PERMISSIONS } = require('../../src/utils/permissions');

const ROUTES_DIR = path.join(__dirname, '..', '..', 'src', 'routes');

const collectPermissionsFromRoutes = () => {
  const files = fs.readdirSync(ROUTES_DIR).filter((file) => file.endsWith('.js'));
  const permissions = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');
    const matcher = /requirePermission\(([^)]*)\)/g;
    let match = matcher.exec(content);
    while (match) {
      const args = match[1];
      for (const perm of args.matchAll(/'([^']+)'/g)) {
        permissions.add(perm[1]);
      }
      match = matcher.exec(content);
    }
  }

  return permissions;
};

test('all route permissions are assignable or explicitly admin-only', () => {
  const routePermissions = collectPermissionsFromRoutes();
  const assignable = new Set(MANAGED_PERMISSIONS);
  const missing = [];

  for (const permission of routePermissions) {
    if (permission === ADMIN_PERMISSION) {
      continue;
    }
    if (!assignable.has(permission)) {
      missing.push(permission);
    }
  }

  assert.deepEqual(
    missing.sort(),
    [],
    `Permissions missing in MANAGED_PERMISSIONS: ${missing.join(', ')}`,
  );
});
