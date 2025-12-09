const { Router } = require('express');
const { body } = require('express-validator');
const {
  register,
  verifyEmail,
  googleAuth,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  resendVerification,
  recoverPassword,
  validateResetToken,
  resetPassword,
  profile,
  updateProfile,
  updateTwoFactor,
  changePassword,
  logout,
  keepAlive,
} = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validateRequest');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();

const passwordValidator = (value) => {
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  if (hasMinLength && hasUppercase && hasLowercase && hasNumber) {
    return true;
  }
  throw new Error('La contraseña no cumple con la complejidad requerida.');
};

const registerValidators = [
  body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
  body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
  body('password').isString().custom(passwordValidator),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden.'),
  body('acceptTerms')
    .toBoolean()
    .isBoolean()
    .withMessage('Debés aceptar los términos y condiciones.')
    .custom((value) => value === true)
    .withMessage('Debés aceptar los términos y condiciones.'),
];

const googleValidators = [
  body().custom((value, { req }) => {
    const { idToken, credential } = req.body;
    if (!idToken && !credential) {
      throw new Error('Se requiere el token de Google ID (idToken o credential).');
    }
    return true;
  }),
  body('idToken').optional().isString().withMessage('El idToken debe ser una cadena.'),
  body('credential').optional().isString().withMessage('El credential debe ser una cadena.'),
];

const loginValidators = [
  body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  body('rememberMe').optional().isBoolean().withMessage('Recordarme debe ser un booleano.').toBoolean(),
];

const challengeTokenPresenceValidator = body().custom((_, { req }) => {
  const challengeToken = req.body.challengeToken;
  const challengeId = req.body.challengeId;
  if (typeof challengeToken === 'string' && challengeToken.trim().length > 0) {
    return true;
  }
  if (typeof challengeId === 'string' && challengeId.trim().length > 0) {
    return true;
  }
  throw new Error('Se requiere el token del desafío de dos pasos.');
});

const challengeTokenFormatValidator = body('challengeToken')
  .optional()
  .isString()
  .withMessage('El token del desafío debe ser una cadena.')
  .trim()
  .notEmpty()
  .withMessage('El token del desafío no puede estar vacío.');

const challengeIdFormatValidator = body('challengeId')
  .optional()
  .isString()
  .withMessage('El token del desafío debe ser una cadena.')
  .trim()
  .notEmpty()
  .withMessage('El token del desafío no puede estar vacío.');

const twoFactorValidators = [
  challengeTokenPresenceValidator,
  challengeTokenFormatValidator,
  challengeIdFormatValidator,
  body('code')
    .isString()
    .matches(/^\d{6}$/)
    .withMessage('Ingresá un código válido de 6 dígitos.'),
];

const twoFactorResendValidators = [
  challengeTokenPresenceValidator,
  challengeTokenFormatValidator,
  challengeIdFormatValidator,
];

const resendVerificationValidators = [
  body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
];

const recoverValidators = [
  body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
];

const resetPasswordValidators = [
  body('token').isString().withMessage('Se requiere el token de restablecimiento de contraseña.'),
  body('password').isString().custom(passwordValidator),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden.'),
];

const updateProfileValidators = [
  body('fullName').trim().notEmpty().withMessage('El nombre completo es obligatorio.'),
];

const changePasswordValidators = [
  body('currentPassword').isString().notEmpty().withMessage('Ingres� tu contrase�a actual.'),
  body('newPassword').isString().custom(passwordValidator),
];

const twoFactorToggleValidators = [
  body('enabled').isBoolean().withMessage('Deb�s indicar si activ�s o desactiv�s 2FA.').toBoolean(),
];

router.post('/register', authLimiter, ...registerValidators, validateRequest, register);

router.get('/verify-email', verifyEmail);

router.post('/google', authLimiter, ...googleValidators, validateRequest, googleAuth);

// Legacy compatibility routes for Google OAuth flows used by older clients.
// They simply redirect to the client login page so the new Google Identity flow can continue.
router.get('/google', (req, res) => {
  const clientBase = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:4000';
  const redirectUrl = new URL('/login', clientBase);
  redirectUrl.searchParams.set('provider', 'google');
  res.redirect(302, redirectUrl.toString());
});

router.get('/google/callback', (req, res) => {
  const clientBase = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:4000';
  const redirectUrl = new URL('/login', clientBase);
  redirectUrl.searchParams.set('provider', 'google');
  redirectUrl.searchParams.set('oauth', 'completed');
  res.redirect(302, redirectUrl.toString());
});

router.post('/login', authLimiter, ...loginValidators, validateRequest, login);

router.post('/login/2fa', authLimiter, ...twoFactorValidators, validateRequest, verifyTwoFactor);

router.post(
  '/login/2fa/resend',
  authLimiter,
  ...twoFactorResendValidators,
  validateRequest,
  resendTwoFactor
);

router.post(
  '/resend-verification',
  authLimiter,
  ...resendVerificationValidators,
  validateRequest,
  resendVerification
);

router.get('/me', requireAuth, profile);
router.patch('/profile', requireAuth, ...updateProfileValidators, validateRequest, updateProfile);
router.post('/profile/password', requireAuth, ...changePasswordValidators, validateRequest, changePassword);
router.post('/profile/2fa', requireAuth, ...twoFactorToggleValidators, validateRequest, updateTwoFactor);

router.get('/keep-alive', requireAuth, keepAlive);

router.post('/logout', requireAuth, logout);

router.post('/recover', authLimiter, ...recoverValidators, validateRequest, recoverPassword);

router.get('/reset/validate', authLimiter, validateResetToken);

router.post('/reset', authLimiter, ...resetPasswordValidators, validateRequest, resetPassword);

// Test CSRF-protected endpoint
router.post('/test-csrf', (req, res) => {
  console.log('[ROUTE] test-csrf route reached');
  res.json({ status: 'ok', message: 'CSRF protection working', body: req.body });
});

module.exports = router;
