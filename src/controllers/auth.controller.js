const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const {
  registerLocal,
  verifyEmailToken,
  registerWithGoogle,
  loginWithEmail,
  verifyTwoFactorChallenge,
  resendTwoFactorCode,
  resendVerificationEmail,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
} = require('../services/auth.service');
const { deleteSessionByToken, getSessionDurationMs } = require('../services/session.service');
const { attachAuthCookie, clearAuthCookie, COOKIE_NAME } = require('../utils/authCookie');
const { dedupePermissions } = require('../utils/permissions');

const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

const setSessionCookie = (res, session) => {
  if (!session?.sessionToken) {
    return;
  }

  attachAuthCookie(res, session.sessionToken, {
    remember: session.rememberMe,
    maxAgeMs: getSessionDurationMs(session.rememberMe),
  });
};

const buildProfile = (user) => {
  if (!user) {
    return undefined;
  }
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    permissions: Array.isArray(user.permissions) ? dedupePermissions(user.permissions) : [],
    twoFactor: {
      isEnabled: Boolean(user.twoFactor?.enabled),
    },
    providers: Array.isArray(user.providers)
      ? user.providers.map((provider) => ({
          provider: provider.provider,
          providerId: provider.providerId,
        }))
      : [],
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await registerLocal({ fullName, email, password }, context);
    const { user, session, ...rest } = result;
    setSessionCookie(res, session);

    const status = result.type === 'pending_verification' ? 201 : 200;
    res.status(status).json({
      ...rest,
      profile: buildProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await verifyEmailToken({ token }, context);

    const accept = req.accepts(['html', 'json']);
    if (accept === 'html') {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FinaTech | Cuenta verificada</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f6f9fc; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 80px auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1); text-align: center; }
    h1 { color: #0066CC; margin-bottom: 12px; }
    p { color: #334155; line-height: 1.5; margin-bottom: 24px; }
    a { display: inline-block; padding: 12px 24px; background: #0066CC; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }
    a:hover { background: #0055a8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>¡Cuenta verificada!</h1>
    <p>Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.</p>
    <a href="/login">Ir a iniciar sesión</a>
  </div>
</body>
</html>`);
      return;
    }

    res.json({
      type: result.type,
      message: result.message,
      profile: buildProfile(result.user),
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken, credential } = req.body;
    const token = idToken || credential;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await registerWithGoogle({ idToken: token }, context);
    const { user, session, ...rest } = result;
    setSessionCookie(res, session);

    res.json({
      success: true,
      ...rest,
      profile: buildProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await loginWithEmail({ email, password, rememberMe }, context);

    if (result.type === 'two_factor_required') {
      const challengeToken = result.challengeToken;
      res.json({
        success: true,
        requiresTwoFactor: true,
        challengeId: challengeToken,
        challengeToken,
        challengeExpiresAt: result.expiresAt,
        message: 'Se requiere la autenticación en dos pasos.',
      });
      return;
    }

    const { user, session, ...rest } = result;
    setSessionCookie(res, session);

    res.json({
      success: true,
      requiresTwoFactor: false,
      message: 'Inicio de sesión exitoso.',
      type: rest.type,
      sessionExpiresAt: session?.expiresAt,
      profile: buildProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

const verifyTwoFactor = async (req, res, next) => {
  try {
    const { challengeToken, challengeId, code } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const normalizedChallenge = challengeToken || challengeId;
    const result = await verifyTwoFactorChallenge({ challengeToken: normalizedChallenge, code }, context);
    const { user, session, ...rest } = result;

    setSessionCookie(res, session);

    res.json({
      success: true,
      requiresTwoFactor: false,
      message: 'Autenticación de dos factores verificada.',
      type: rest.type,
      sessionExpiresAt: session?.expiresAt,
      profile: buildProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await resendVerificationEmail({ email }, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const resendTwoFactor = async (req, res, next) => {
  try {
    const { challengeToken, challengeId } = req.body;
    const normalizedChallenge = challengeToken || challengeId;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await resendTwoFactorCode({ challengeToken: normalizedChallenge }, context);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res) => {
  res.json({ profile: buildProfile(req.user) });
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName } = req.body;
    if (typeof fullName !== 'string' || !fullName.trim()) {
      throw new AppError('El nombre completo es obligatorio.', 400, { code: 'INVALID_NAME' });
    }
    req.user.fullName = fullName.trim();
    await req.user.save();
    res.json({ profile: buildProfile(req.user) });
  } catch (error) {
    next(error);
  }
};

const updateTwoFactor = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      throw new AppError('Debés indicar si activás o desactivás 2FA.', 400, { code: 'INVALID_2FA_STATE' });
    }
    req.user.twoFactor = req.user.twoFactor || {};
    req.user.twoFactor.enabled = enabled;
    await req.user.save();
    res.json({ profile: buildProfile(req.user) });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user?.passwordHash) {
      throw new AppError('Tu cuenta no tiene contraseña local configurada.', 400, { code: 'NO_LOCAL_PASSWORD' });
    }

    if (currentPassword === newPassword) {
      throw new AppError('La nueva contraseña debe ser distinta a la actual.', 400, { code: 'PASSWORD_UNCHANGED' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new AppError('La contraseña actual no es correcta.', 400, { code: 'INVALID_PASSWORD' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true, profile: buildProfile(user) });
  } catch (error) {
    next(error);
  }
};

const keepAlive = async (req, res) => {
  res.json({
    ok: true,
    sessionExpiresAt: req.session?.expiresAt ?? null,
  });
};

const logout = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.[COOKIE_NAME];
    clearAuthCookie(res);
    res.status(204).send();
    if (sessionToken) {
      setImmediate(() => {
        deleteSessionByToken(sessionToken).catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to delete session on logout', error);
        });
      });
    }
  } catch (error) {
    next(error);
  }
};

const recoverPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await requestPasswordReset({ email }, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateResetToken = async (req, res, next) => {
  try {
    const { token } = req.query;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await validatePasswordResetToken({ token }, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const context = { ip: req.ip, userAgent: req.get('user-agent') };
    const result = await resetPassword({ token, password }, context);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  googleAuth,
  login,
  verifyTwoFactor,
  resendTwoFactor,
  resendVerification,
  profile,
  updateProfile,
  updateTwoFactor,
  changePassword,
  keepAlive,
  logout,
  recoverPassword,
  validateResetToken,
  resetPassword: resetPasswordController,
};
