const {
  listUsers,
  updatePermissions,
  getManagedPermissions,
  setMessengerFlag,
} = require('../services/admin.service');

const getUsers = async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (_req, res, next) => {
  try {
    res.json({ permissions: getManagedPermissions() });
  } catch (error) {
    next(error);
  }
};

const updateUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const user = await updatePermissions({
      targetUserId: userId,
      permissions,
      actingUserId: req.user?._id,
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateMessengerFlag = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { enabled } = req.body;
    const user = await setMessengerFlag({ targetUserId: userId, enabled });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getPermissions,
  updateUserPermissions,
  updateMessengerFlag,
};
