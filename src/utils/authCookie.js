const COOKIE_NAME = 'finatech_session';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const buildCookieOptions = ({ remember = false, maxAgeMs } = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultMaxAge =
    Number(process.env.SESSION_MAX_AGE_MS) || THIRTY_MINUTES_MS;
  const rememberMaxAge =
    Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || THIRTY_MINUTES_MS;
  const maxAge = typeof maxAgeMs === 'number' ? maxAgeMs : remember ? rememberMaxAge : defaultMaxAge;

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
    path: '/',
  };
};

const attachAuthCookie = (res, token, options = {}) => {
  if (!token) {
    return;
  }
  const remember = Boolean(options.remember);
  const maxAgeMs =
    typeof options.maxAgeMs === 'number' && options.maxAgeMs > 0 ? options.maxAgeMs : undefined;
  res.cookie(COOKIE_NAME, token, buildCookieOptions({ remember, maxAgeMs }));
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
