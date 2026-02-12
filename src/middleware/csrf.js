const crypto = require('crypto');
const { logger } = require('../utils/logger');

const CSRF_COOKIE_NAME = 'finatech_csrf';
const CSRF_COOKIE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Lista de rutas que no requieren verificación CSRF
const DEFAULT_EXCLUDED_PATHS = [
  '/api/auth/google',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/recover',
  '/api/auth/reset',
  '/api/auth/resend-verification',
  '/api/auth/logout', // logout should not require CSRF as it simply clears the session cookie
];

const normalizeSameSite = (value, fallback = 'lax') => {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (normalized === 'none') {
    return 'None';
  }
  if (normalized === 'strict') {
    return 'Strict';
  }
  return 'Lax';
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

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureCsrfCookie(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultSameSite = normalizeSameSite(
    process.env.CSRF_COOKIE_SAME_SITE || process.env.SESSION_COOKIE_SAME_SITE,
    isProduction ? 'lax' : 'lax',
  );
  const secureOverride = parseBooleanEnv(process.env.CSRF_COOKIE_SECURE);
  const defaultSecure =
    secureOverride !== undefined
      ? secureOverride
      : defaultSameSite === 'None'
      ? true
      : isProduction;

  const { 
    cookieName = CSRF_COOKIE_NAME,
    maxAge = CSRF_COOKIE_EXPIRY,
    path = '/',
    sameSite = defaultSameSite,
    secure = defaultSecure,
    httpOnly = false,
  } = options;

  return (req, res, next) => {
    let token = req.cookies?.[cookieName];

    if (!token) {
      token = generateCsrfToken();
      // Determine cookie domain dynamically on first request if not provided
      res.cookie(cookieName, token, {
        maxAge,
        path,
        sameSite,
        secure,
        httpOnly,
        ...(process.env.CSRF_COOKIE_DOMAIN ? { domain: process.env.CSRF_COOKIE_DOMAIN } : {})
      });
    }

    if (token) {
      res.locals.csrfToken = token;
      res.setHeader('X-CSRF-Token', token);
    }

    next();
  };
}

function csrfProtect(options = {}) {
  const { cookieName = CSRF_COOKIE_NAME, excludedPaths = DEFAULT_EXCLUDED_PATHS } = options;
  
  return function(req, res, next) {
    logger.debug('csrf_check', { method: req.method, path: req.path });
    
    // Skip CSRF protection for safe methods
    if (SAFE_METHODS.has(req.method)) {
      logger.debug('csrf_skip_safe');
      return next();
    }
    // Skip CSRF protection for excluded paths
    const url = req.originalUrl || req.url;
    if (excludedPaths.some((path) => url.startsWith(path))) {
      logger.debug('csrf_skip_excluded', { path: url });
      return next();
    }
    logger.debug('csrf_tokens_check');
    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.get('X-CSRF-Token') || req.get('X-CSRF');
    
    logger.debug('csrf_token_presence', {
      cookie: cookieToken ? 'present' : 'missing',
      header: headerToken ? 'present' : 'missing',
    });

    if (!cookieToken) {
      logger.warn('csrf_reject_missing_cookie');
      return res.status(403).json({ 
        error: 'CSRF token missing',
        message: 'CSRF token required in cookie' 
      });
    }

    if (!headerToken) {
      logger.warn('csrf_reject_missing_header');
      return res.status(403).json({ 
        error: 'CSRF token missing',
        message: 'CSRF token required in X-CSRF-Token header' 
      });
    }

    if (cookieToken !== headerToken) {
      logger.warn('csrf_reject_mismatch');
      return res.status(403).json({ 
        error: 'CSRF token mismatch',
        message: 'Invalid CSRF token' 
      });
    }

    logger.debug('csrf_ok');
    next();
  };
}

module.exports = {
  ensureCsrfCookie,
  csrfProtect,
  CSRF_COOKIE_NAME
};
