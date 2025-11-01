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
const { deleteSessionByToken } = require('../services/session.service');
const { attachAuthCookie, clearAuthCookie, COOKIE_NAME } = require('../utils/authCookie');

const buildProfile = (user) => {
  if (!user) {
    return undefined;
  }
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
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
    if (session?.sessionToken) {
      attachAuthCookie(res, session.sessionToken, { remember: session.rememberMe });
    }

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
    if (session?.sessionToken) {
      attachAuthCookie(res, session.sessionToken, { remember: session.rememberMe });
    }

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
    if (session?.sessionToken) {
      attachAuthCookie(res, session.sessionToken, { remember: session.rememberMe });
    }

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

    if (session?.sessionToken) {
      attachAuthCookie(res, session.sessionToken, { remember: session.rememberMe });
    }

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
  logout,
  recoverPassword,
  validateResetToken,
  resetPassword: resetPasswordController,
};
