const COOKIE_NAME = 'finatech_session';

const buildCookieOptions = (remember = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultMaxAge =
    Number(process.env.SESSION_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;
  const rememberMaxAge =
    Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || 30 * 24 * 60 * 60 * 1000;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: remember ? rememberMaxAge : defaultMaxAge,
    path: '/',
  };
};

const attachAuthCookie = (res, token, options = {}) => {
  if (!token) {
    return;
  }
  const remember = Boolean(options.remember);
  res.cookie(COOKIE_NAME, token, buildCookieOptions(remember));
};

const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

module.exports = { attachAuthCookie, clearAuthCookie, COOKIE_NAME };
