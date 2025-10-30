const crypto = require('crypto');

const CSRF_COOKIE_NAME = 'finatech_csrf';
const CSRF_COOKIE_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function ensureCsrfCookie(options = {}) {
  const { 
    cookieName = CSRF_COOKIE_NAME,
    maxAge = CSRF_COOKIE_EXPIRY,
    path = '/',
    sameSite = process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    secure = process.env.NODE_ENV === 'production',
    httpOnly = false,
    // In production, set cookie domain to the parent domain so that
    // both the frontend and API sub-domains share the same cookie.
    // e.g. frontend: finatech-cs2p.onrender.com
    //       backend:  finatech-qp5l.onrender.com
    // We trim the first sub-domain and keep the eTLD+1 (onrender.com) to
    // allow cross-subdomain access while staying scoped to our deployment.
    // This can be overridden via the CSRF_COOKIE_DOMAIN env variable when
    // running locally or if the default inference is not correct.

  } = options;

  return (req, res, next) => {
    if (!req.cookies || !req.cookies[cookieName]) {
      const token = generateCsrfToken();
              // Determine cookie domain dynamically on first request if not provided
        const inferredDomain = process.env.CSRF_COOKIE_DOMAIN ||
          (process.env.NODE_ENV === 'production' && req.hostname?.split('.').slice(-2).join('.') !== 'localhost'
            ? `.${req.hostname.split('.').slice(-2).join('.')}`
            : undefined);

        res.cookie(cookieName, token, {
          maxAge,
          path,
          sameSite,
          secure,
          httpOnly,
          ...(inferredDomain ? { domain: inferredDomain } : {})
        });
    }
    next();
  };
}

function csrfProtect(options = {}) {
  const { cookieName = CSRF_COOKIE_NAME } = options;
  
  return function(req, res, next) {
    console.log(`[CSRF] Processing ${req.method} ${req.path}`);
    
    // Skip CSRF protection for safe methods
    if (SAFE_METHODS.has(req.method)) {
      console.log('[CSRF] Safe method, skipping');
      return next();
    }

    console.log('[CSRF] Checking tokens...');
    const cookieToken = req.cookies?.[cookieName];
    const headerToken = req.get('X-CSRF-Token') || req.get('X-CSRF');
    
    console.log(`[CSRF] Cookie token: ${cookieToken ? 'present' : 'missing'}`);
    console.log(`[CSRF] Header token: ${headerToken ? 'present' : 'missing'}`);

    if (!cookieToken) {
      console.log('[CSRF] Rejecting: no cookie token');
      return res.status(403).json({ 
        error: 'CSRF token missing',
        message: 'CSRF token required in cookie' 
      });
    }

    if (!headerToken) {
      console.log('[CSRF] Rejecting: no header token');
      return res.status(403).json({ 
        error: 'CSRF token missing',
        message: 'CSRF token required in X-CSRF-Token header' 
      });
    }

    if (cookieToken !== headerToken) {
      console.log('[CSRF] Rejecting: token mismatch');
      return res.status(403).json({ 
        error: 'CSRF token mismatch',
        message: 'Invalid CSRF token' 
      });
    }

    console.log('[CSRF] Tokens match, proceeding');
    next();
  };
}

module.exports = {
  ensureCsrfCookie,
  csrfProtect,
  CSRF_COOKIE_NAME
};
