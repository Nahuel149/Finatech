const {
  findSessionByToken,
  deleteSessionByToken,
  refreshSessionExpiry,
  getSessionDurationMs,
} = require('../services/session.service');
const AppError = require('../utils/AppError');
const { COOKIE_NAME, attachAuthCookie } = require('../utils/authCookie');

const requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.[COOKIE_NAME];
    if (!sessionToken) {
      throw new AppError('Authentication required', 401);
    }

    const session = await findSessionByToken(sessionToken);

    if (!session || session.expiresAt < new Date()) {
      if (sessionToken) {
        await deleteSessionByToken(sessionToken);
      }
      throw new AppError('Authentication required', 401);
    }

    await refreshSessionExpiry(session);
    attachAuthCookie(res, sessionToken, {
      remember: session.rememberMe,
      maxAgeMs: getSessionDurationMs(session.rememberMe),
    });

    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
