const Session = require('../models/Session');
const { generateRandomToken, hashToken } = require('../utils/token');

const SESSION_MAX_AGE_MS =
  Number(process.env.SESSION_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
const SESSION_REMEMBER_MAX_AGE_MS =
  Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;

const buildExpiry = (rememberMe) =>
  new Date(Date.now() + (rememberMe ? SESSION_REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS));

const createSession = async ({ user, rememberMe = false, userAgent, ipAddress }) => {
  const token = generateRandomToken(48);
  const tokenHash = hashToken(token);
  const expiresAt = buildExpiry(rememberMe);

  await Session.create({
    user: user._id,
    tokenHash,
    expiresAt,
    rememberMe,
    userAgent,
    ipAddress,
  });

  return { token, expiresAt, rememberMe };
};

const findSessionByToken = async (token) => {
  if (!token) {
    return null;
  }
  const tokenHash = hashToken(token);
  return Session.findOne({ tokenHash }).populate('user');
};

const deleteSessionByToken = async (token) => {
  if (!token) {
    return;
  }
  const tokenHash = hashToken(token);
  await Session.deleteOne({ tokenHash });
};

const deleteSessionsByUser = async (userId) => {
  await Session.deleteMany({ user: userId });
};

module.exports = {
  createSession,
  findSessionByToken,
  deleteSessionByToken,
  deleteSessionsByUser,
};
