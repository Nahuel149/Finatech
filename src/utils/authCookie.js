const COOKIE_NAME = 'finatech_session';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const normalizeSameSite = (value, fallback = 'lax') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (normalized === 'none') {
    return 'none';
  }
  if (normalized === 'strict') {
    return 'strict';
  }
  return 'lax';
};

const parseBooleanEnv = (value) => {
  if (value === undefined) {
    return undefined;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return undefined;
};

const buildBaseCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = normalizeSameSite(
    process.env.SESSION_COOKIE_SAME_SITE,
    isProduction ? 'lax' : 'lax',
  );
  const secureOverride = parseBooleanEnv(process.env.SESSION_COOKIE_SECURE);
  const secure = secureOverride !== undefined ? secureOverride : sameSite === 'none' ? true : isProduction;
  const domain = process.env.SESSION_COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(domain ? { domain } : {}),
  };
};

const buildCookieOptions = ({ remember = false, maxAgeMs } = {}) => {
  const defaultMaxAge =
    Number(process.env.SESSION_MAX_AGE_MS) || THIRTY_MINUTES_MS;
  const rememberMaxAge =
    Number(process.env.SESSION_REMEMBER_MAX_AGE_MS) || THIRTY_MINUTES_MS;
  const maxAge = typeof maxAgeMs === 'number' ? maxAgeMs : remember ? rememberMaxAge : defaultMaxAge;

  return {
    maxAge,
    ...buildBaseCookieOptions(),
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
  res.clearCookie(COOKIE_NAME, buildBaseCookieOptions());
};

module.exports = { attachAuthCookie, clearAuthCookie, COOKIE_NAME };
