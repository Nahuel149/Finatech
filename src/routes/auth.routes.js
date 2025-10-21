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
  logout,
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

const googleValidators = [body('idToken').isString().withMessage('Se requiere el token de Google ID.')];

const loginValidators = [
  body('email').isEmail().withMessage('Ingresá un correo electrónico válido.').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  body('rememberMe').optional().isBoolean().withMessage('Recordarme debe ser un booleano.').toBoolean(),
];

const twoFactorValidators = [
  body('challengeToken').isString().withMessage('Se requiere el token del desafío de dos pasos.'),
  body('code')
    .isString()
    .matches(/^\d{6}$/)
    .withMessage('Ingresá un código válido de 6 dígitos.'),
];

const twoFactorResendValidators = [
  body('challengeToken').isString().withMessage('Se requiere el token del desafío de dos pasos.'),
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

router.post('/register', authLimiter, ...registerValidators, validateRequest, register);

router.get('/verify-email', verifyEmail);

router.post('/google', authLimiter, ...googleValidators, validateRequest, googleAuth);

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

router.post('/logout', requireAuth, logout);

router.post('/recover', authLimiter, ...recoverValidators, validateRequest, recoverPassword);

router.get('/reset/validate', authLimiter, validateResetToken);

router.post('/reset', authLimiter, ...resetPasswordValidators, validateRequest, resetPassword);

module.exports = router;
