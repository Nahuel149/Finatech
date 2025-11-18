const Session = require('../models/Session');
const { generateRandomToken, hashToken } = require('../utils/token');

const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS) || THIRTY_MINUTES_MS;
const SESSION_REMEMBER_MAX_AGE_MS =
  Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || THIRTY_MINUTES_MS;

const getSessionDurationMs = (rememberMe = false) =>
  rememberMe ? SESSION_REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS;

const buildExpiry = (rememberMe) => new Date(Date.now() + getSessionDurationMs(rememberMe));

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

const refreshSessionExpiry = async (session) => {
  if (!session) {
    return null;
  }
  const expiresAt = buildExpiry(session.rememberMe);
  session.expiresAt = expiresAt;
  await session.save();
  return expiresAt;
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
  refreshSessionExpiry,
  getSessionDurationMs,
};
