const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20, // Allow more requests per IP to accommodate multiple users
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos desde esta dirección IP. Intentá de nuevo más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  // Skip rate limiting for successful requests
  skipSuccessfulRequests: true,
});

module.exports = { authLimiter };
