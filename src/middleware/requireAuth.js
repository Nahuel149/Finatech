const { findSessionByToken, deleteSessionByToken } = require('../services/session.service');
const AppError = require('../utils/AppError');
const { COOKIE_NAME } = require('../utils/authCookie');

const requireAuth = async (req, _res, next) => {
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

    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
