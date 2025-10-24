const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'finatech_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function ensureCsrfCookie(options = {}) {
  const {
    cookieName = CSRF_COOKIE_NAME,
    maxAgeMs = 2 * 60 * 60 * 1000, // 2 hours
    path = '/',
    sameSite = 'none', // allow cross-site for fetch with credentials
    secure = true,
    httpOnly = false, // must be readable by frontend to send header
    domain,
  } = options;

  return (req, res, next) => {
    try {
      const existing = req.cookies?.[cookieName];
      if (!existing) {
        const token = crypto.randomBytes(32).toString('hex');
        const cookieOptions = { maxAge: maxAgeMs, path, sameSite, secure, httpOnly };
        if (domain) cookieOptions.domain = domain;
        res.cookie(cookieName, token, cookieOptions);
      }
    } catch (_) {
      // best-effort cookie set; continue
    }
    next();
  };
}

function csrfProtect(options = {}) {
  const { cookieName = CSRF_COOKIE_NAME } = options;
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.get('X-CSRF-Token') || req.get('X-CSRF');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    return next();
  };
}

module.exports = {
  ensureCsrfCookie,
  csrfProtect,
  CSRF_COOKIE_NAME,
};