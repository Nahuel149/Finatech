const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const TwoFactorChallenge = require('../models/TwoFactorChallenge');
const AppError = require('../utils/AppError');
const { sendEmail } = require('../utils/email');
const { logger } = require('../utils/logger');
const { generateRandomToken, hashToken } = require('../utils/token');
const { logSecurityEvent } = require('./securityLog.service');
const { createSession, deleteSessionsByUser } = require('./session.service');
const {
  ADMIN_PERMISSION,
  dedupePermissions,
} = require('../utils/permissions');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const SALT_ROUNDS = 12;
const VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5;
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES) || 15;
const TWO_FACTOR_CHALLENGE_DURATION_MINUTES =
  Number(process.env.TWO_FACTOR_CHALLENGE_DURATION_MINUTES) || 5;
const TWO_FACTOR_CODE_LENGTH = 6;
const LOGIN_WINDOW_MS = LOGIN_LOCK_MINUTES * 60 * 1000;
const PASSWORD_RESET_WINDOW_MINUTES = Number(process.env.PASSWORD_RESET_WINDOW_MINUTES) || 30;
const SKIP_EMAIL_VERIFICATION = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION !== 'true';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isTwoFactorEnabled = (user) => Boolean(user?.twoFactor?.enabled);
const shouldBypassTwoFactor = () => process.env.AUTH_BYPASS_2FA === 'true';
// For testing on hosts without SMTP, we reuse AUTH_BYPASS_2FA to disable email-dependent auth flows
// (email verification + password reset).
const shouldBypassAuthEmails = () => process.env.AUTH_BYPASS_2FA === 'true';

const ensureBaselinePermissions = (user) => {
  if (!user) {
    return false;
  }

  const normalizedPermissions = dedupePermissions(user.permissions || []);
  const originalLength = Array.isArray(user.permissions) ? user.permissions.length : 0;
  let changed = !Array.isArray(user.permissions) || normalizedPermissions.length !== originalLength;

  const isAdminEmail =
    typeof user.email === 'string' &&
    ADMIN_EMAILS.includes(user.email.trim().toLowerCase());

  if (isAdminEmail && !normalizedPermissions.includes(ADMIN_PERMISSION)) {
    normalizedPermissions.push(ADMIN_PERMISSION);
    changed = true;
  }

  if (changed) {
    user.permissions = normalizedPermissions;
  }

  return changed;
};

const buildClientUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const clientBase = process.env.CLIENT_URL || undefined;
  const apiBase = process.env.APP_URL || process.env.API_BASE_URL;
  const defaultBase = 'http://localhost:4000';

  const isApiPath = normalizedPath.startsWith('/api/');
  const base = (isApiPath ? apiBase : clientBase) || apiBase || clientBase || defaultBase;

  return new URL(normalizedPath, base).toString();
};

const buildRequestMetadata = (context = {}) => ({
  ipAddress: context.ip,
  userAgent: context.userAgent,
});

const generateTwoFactorCode = () => {
  const min = 10 ** (TWO_FACTOR_CODE_LENGTH - 1);
  const max = 10 ** TWO_FACTOR_CODE_LENGTH;
  return (Math.floor(Math.random() * (max - min)) + min).toString();
};

const sendVerificationEmail = async (user, plainToken) => {
  const verificationUrl = buildClientUrl(`/api/auth/verify-email?token=${plainToken}`);

  const subject = 'Confirmá tu cuenta de FinaTech';
  const text = `Hola ${user.fullName},

Gracias por registrarte en FinaTech.
Hace clic en el siguiente enlace para confirmar tu cuenta:
${verificationUrl}

Este enlace caduca en 24 horas.`;

  const html = `<p>Hola ${user.fullName},</p>
<p>Gracias por registrarte en <strong>FinaTech</strong>.</p>
<p>Hacé clic en el siguiente enlace para confirmar tu cuenta:</p>
<p><a href="${verificationUrl}">${verificationUrl}</a></p>
<p>Este enlace caduca en 24 horas.</p>`;

  try {
    await sendEmail({
      to: user.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    // Provide context for diagnosis when SMTP fails
    throw new AppError(
      'No pudimos enviar el correo de verificación. Intentá nuevamente más tarde.',
      502,
      {
        code: 'VERIFICATION_EMAIL_FAILED',
        originalError: err?.message,
        smtp: err?.smtp,
      },
    );
  }
};

const sendTwoFactorCodeEmail = async (user, code) => {
  const subject = 'Tu código de seguridad de FinaTech';
  const text = `Hola ${user.fullName},

Recibimos un intento de inicio de sesión en tu cuenta de FinaTech.
Ingresá el siguiente código de verificación de 6 dígitos para continuar:

${code}

Este código caduca en ${TWO_FACTOR_CHALLENGE_DURATION_MINUTES} minutos. Si no solicitaste este código, ignorá este correo.`;

  const html = `<p>Hola ${user.fullName},</p>
<p>Recibimos un intento de inicio de sesión en tu cuenta de <strong>FinaTech</strong>.</p>
<p>Ingresá el siguiente código de verificación de 6 dígitos para continuar:</p>
<p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
<p>Este código caduca en ${TWO_FACTOR_CHALLENGE_DURATION_MINUTES} minutos. Si no solicitaste este código, ignorá este correo.</p>`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendTwoFactorToggleCodeEmail = async (user, code, enabled) => {
  const actionLabel = enabled ? 'activar' : 'desactivar';
  const subject = `Confirma para ${actionLabel} 2FA en FinaTech`;
  const text = `Hola ${user.fullName},

Solicitaste ${actionLabel} la autenticacion en dos pasos (2FA) por correo en tu cuenta de FinaTech.
Ingresa el siguiente codigo de verificacion de 6 digitos para confirmar el cambio:

${code}

Este codigo caduca en ${TWO_FACTOR_CHALLENGE_DURATION_MINUTES} minutos. Si no fuiste vos, ignora este correo.`;

  const html = `<p>Hola ${user.fullName},</p>
<p>Solicitaste <strong>${actionLabel}</strong> la autenticacion en dos pasos (2FA) por correo en tu cuenta de <strong>FinaTech</strong>.</p>
<p>Ingresa el siguiente codigo de verificacion de 6 digitos para confirmar el cambio:</p>
<p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
<p>Este codigo caduca en ${TWO_FACTOR_CHALLENGE_DURATION_MINUTES} minutos. Si no fuiste vos, ignora este correo.</p>`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const isResendTestingRestrictionError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('testing emails') &&
    (message.includes('verify a domain') || message.includes('resend.com/domains'))
  );
};

const mapTwoFactorToggleEmailError = (error) => {
  if (isResendTestingRestrictionError(error)) {
    return new AppError(
      'La autenticacion en dos pasos (2FA) por correo esta deshabilitada temporalmente mientras probamos la app.',
      400,
      {
        code: 'TWO_FACTOR_EMAIL_TESTING_ONLY',
      },
    );
  }

  return new AppError(
    'No pudimos enviar el codigo de verificacion para confirmar el cambio de 2FA. Intenta nuevamente mas tarde.',
    502,
    {
      code: 'TWO_FACTOR_EMAIL_FAILED',
      details: { providerCode: error?.code, providerMessage: error?.message },
    },
  );
};
const sendAccountLockedEmail = async (user) => {
  const subject = 'Intentos de inicio de sesión bloqueados';
  const text = `Hola ${user.fullName},

Detectamos múltiples intentos fallidos de inicio de sesión en tu cuenta de FinaTech.
Por seguridad, bloqueamos los intentos durante ${LOGIN_LOCK_MINUTES} minutos.

Si fuiste vos, podés intentar nuevamente más tarde. Si no reconocés esta actividad, te recomendamos cambiar tu contraseña una vez que recuperes el acceso.`;

  const html = `<p>Hola ${user.fullName},</p>
<p>Detectamos múltiples intentos fallidos de inicio de sesión en tu cuenta de <strong>FinaTech</strong>.</p>
<p>Por seguridad, bloqueamos los intentos durante ${LOGIN_LOCK_MINUTES} minutos.</p>
<p>Si fuiste vos, podés intentar nuevamente más tarde. Si no reconocés esta actividad, te recomendamos cambiar tu contraseña una vez que recuperes el acceso.</p>`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const sendPasswordResetEmail = async (user, plainToken) => {
  const resetUrl = buildClientUrl(`/reset?token=${plainToken}`);

  const subject = 'Restablecé tu contraseña de FinaTech';
  const text = `Hola ${user.fullName},

Recibimos una solicitud para restablecer tu contraseña de FinaTech.
Usá el siguiente enlace para definir una nueva contraseña. Este enlace vence en ${PASSWORD_RESET_WINDOW_MINUTES} minutos.

${resetUrl}

Si no solicitaste este cambio, podés ignorar este mensaje.`;

  const html = `<p>Hola ${user.fullName},</p>
<p>Recibimos una solicitud para restablecer tu contraseña de <strong>FinaTech</strong>.</p>
<p>Usá el siguiente enlace para definir una nueva contraseña. Este enlace vence en ${PASSWORD_RESET_WINDOW_MINUTES} minutos.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Si no solicitaste este cambio, podés ignorar este mensaje.</p>`;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

const ensureGoogleClient = () => {
  if (!googleClient) {
    throw new AppError('Google OAuth no está configurado', 500, {
      code: 'GOOGLE_NOT_CONFIGURED',
    });
  }
  return googleClient;
};

const buildVerificationDetails = () => {
  const plainToken = generateRandomToken(48);
  return {
    plainToken,
    verificationPayload: {
      token: hashToken(plainToken),
      expiresAt: new Date(Date.now() + VERIFICATION_WINDOW_MS),
    },
  };
};

const buildPasswordResetDetails = () => {
  const plainToken = generateRandomToken(48);
  return {
    plainToken,
    resetPayload: {
      token: hashToken(plainToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_WINDOW_MINUTES * 60 * 1000),
    },
  };
};

const createTwoFactorChallenge = async ({ user, rememberMe, context }) => {
  const plainToken = generateRandomToken(32);
  const hashedToken = hashToken(plainToken);
  const code = generateTwoFactorCode();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);

  // Delete login challenges (and legacy docs without purpose) only.
  await TwoFactorChallenge.deleteMany({
    user: user._id,
    $or: [{ purpose: 'login' }, { purpose: { $exists: false } }],
  });
  await TwoFactorChallenge.create({
    user: user._id,
    token: hashedToken,
    codeHash,
    purpose: 'login',
    expiresAt,
    rememberMe: Boolean(rememberMe),
    metadata: buildRequestMetadata(context),
  });

  sendTwoFactorCodeEmail(user, code).catch((err) => {
    // eslint-disable-next-line no-console
    logger.error('send_2fa_email_failed', { message: err.message });
  });

  return { challengeToken: plainToken, expiresAt };
};

const createTwoFactorToggleChallenge = async ({ user, enabled, context }) => {
  if (shouldBypassAuthEmails()) {
    throw new AppError('La verificacion por email esta deshabilitada por configuracion.', 400, {
      code: 'EMAIL_VERIFICATION_DISABLED',
    });
  }

  const plainToken = generateRandomToken(32);
  const hashedToken = hashToken(plainToken);
  const code = generateTwoFactorCode();
  const codeHash = hashToken(code);
  const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);

  await TwoFactorChallenge.deleteMany({ user: user._id, purpose: 'toggle_2fa' });
  await TwoFactorChallenge.create({
    user: user._id,
    token: hashedToken,
    codeHash,
    purpose: 'toggle_2fa',
    toggleEnabledTarget: Boolean(enabled),
    expiresAt,
    rememberMe: false,
    metadata: buildRequestMetadata(context),
  });

  try {
    await sendTwoFactorToggleCodeEmail(user, code, Boolean(enabled));
  } catch (error) {
    logger.error('send_2fa_toggle_email_failed', { message: error?.message, code: error?.code });
    throw mapTwoFactorToggleEmailError(error);
  }

  return { challengeToken: plainToken, expiresAt };
};

const issueSession = async ({ user, rememberMe = false, context }) => {
  const metadata = buildRequestMetadata(context);
  const { token, expiresAt, rememberMe: storedRemember } = await createSession({
    user,
    rememberMe,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return { sessionToken: token, rememberMe: storedRemember, expiresAt };
};

const registerLocal = async ({ fullName, email, password }, context = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  const requestMetadata = buildRequestMetadata(context);
  const skipVerification = SKIP_EMAIL_VERIFICATION || shouldBypassAuthEmails();

  if (user && user.isVerified) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'local',
      status: 'duplicate_verified',
      ...requestMetadata,
    });
    throw new AppError(
      'El correo electrónico ya está registrado. Iniciá sesión o restablecé tu contraseña.',
      409,
      { code: 'EMAIL_ALREADY_REGISTERED' }
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationDetails = skipVerification ? null : buildVerificationDetails();
  const plainToken = verificationDetails?.plainToken;
  const verificationPayload = verificationDetails?.verificationPayload;

  if (!user) {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      providers: [{ provider: 'local' }],
      isVerified: skipVerification,
      verification: skipVerification ? undefined : verificationPayload,
      lastLoginAt: skipVerification ? new Date() : undefined,
      audit: {
        createdByIp: requestMetadata.ipAddress || null,
        createdByAgent: requestMetadata.userAgent || null,
      },
    });

    const permissionsChanged = ensureBaselinePermissions(user);
    if (permissionsChanged) {
      await user.save();
    }

    if (skipVerification) {
      const session = await issueSession({ user, context, rememberMe: false });
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'registration',
        provider: 'local',
        status: 'verified_without_email',
        ...requestMetadata,
      });
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'login',
        provider: 'local',
        status: 'login_success',
        ...requestMetadata,
      });
      return {
        type: 'verified',
        message: 'Cuenta creada y verificada. Ya podés usar la app.',
        user,
        session,
      };
    }

    try {
      await sendVerificationEmail(user, plainToken);
    } catch (error) {
      // eslint-disable-next-line no-console
      logger.error('send_verification_email_failed', { message: error.message });
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'registration',
        provider: 'local',
        status: 'error',
        ...requestMetadata,
        metadata: {
          reason: 'verification_email_failed',
          smtp: {
            code: error.code,
            message: error.message,
          },
        },
      });

      const appErr = new AppError(
        'No se pudo enviar el email de verificación. Intentá nuevamente en unos minutos.',
        502,
        { code: error.code === 'ETIMEDOUT' ? 'EMAIL_DELIVERY_TIMEOUT' : 'SMTP_CONNECTION_ERROR' }
      );
      appErr.code = error.code === 'ETIMEDOUT' ? 'EMAIL_DELIVERY_TIMEOUT' : 'SMTP_CONNECTION_ERROR';
      throw appErr;
    }
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'local',
      status: 'pending_verification',
      ...requestMetadata,
    });
    return {
      type: 'pending_verification',
      message: 'Revisá tu correo para confirmar tu cuenta.',
      user,
    };
  }

  if (!user.isVerified && user.hasProvider('google')) {
    ensureBaselinePermissions(user);
    user.passwordHash = passwordHash;
    user.addProvider('local');
    user.isVerified = true;
    user.verification = undefined;
    user.fullName = user.fullName || fullName;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastFailedLoginAt = undefined;
    user.lastLoginAt = new Date();
    if (!user.audit || (!user.audit.createdByIp && !user.audit.createdByAgent)) {
      user.audit = {
        createdByIp: requestMetadata.ipAddress || null,
        createdByAgent: requestMetadata.userAgent || null,
      };
    }
    await user.save();
    const session = await issueSession({ user, context, rememberMe: false });

    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'local',
      status: 'merged',
      ...requestMetadata,
    });
    return {
      type: 'merged_google',
      message:
        'Encontramos una cuenta de Google con este email. La vinculamos, verificamos tu cuenta y te iniciamos sesión.',
      user,
      session,
    };
  }

  user.fullName = fullName;
  user.passwordHash = passwordHash;
  user.addProvider('local');
  ensureBaselinePermissions(user);

  if (skipVerification) {
    user.isVerified = true;
    user.verification = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastFailedLoginAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const session = await issueSession({ user, context, rememberMe: false });
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'local',
      status: 'verified_without_email',
      ...requestMetadata,
    });
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: 'local',
      status: 'login_success',
      ...requestMetadata,
    });

    return {
      type: 'verified',
      message: 'Cuenta creada y verificada. Ya podés usar la app.',
      user,
      session,
    };
  }

  user.verification = verificationPayload;
  user.isVerified = false;
  await user.save();

  try {
    await sendVerificationEmail(user, plainToken);
  } catch (error) {
    // eslint-disable-next-line no-console
    logger.error('send_verification_email_failed', { message: error.message });
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'local',
      status: 'error',
      ...requestMetadata,
      metadata: {
        reason: 'verification_email_failed',
        smtp: { code: error.code, message: error.message },
      },
    });
    const appErr = new AppError(
      'No se pudo enviar el email de verificación. Intentá nuevamente en unos minutos.',
      502,
      { code: error.code === 'ETIMEDOUT' ? 'EMAIL_DELIVERY_TIMEOUT' : 'VERIFICATION_EMAIL_FAILED' }
    );
    appErr.code = error.code === 'ETIMEDOUT' ? 'EMAIL_DELIVERY_TIMEOUT' : 'VERIFICATION_EMAIL_FAILED';
    throw appErr;
  }
  await logSecurityEvent({
    user: user._id,
    email: normalizedEmail,
    eventType: 'registration',
    provider: 'local',
    status: 'pending_verification',
    ...requestMetadata,
  });

  return {
    type: 'pending_verification',
    message: 'Revisá tu correo para confirmar tu cuenta.',
    user,
  };
};

const verifyEmailToken = async ({ token }, context = {}) => {
  if (!token) {
    throw new AppError('Se requiere el token de verificación', 400);
  }

  const hashed = hashToken(token);
  const user = await User.findOne({
    'verification.token': hashed,
    'verification.expiresAt': { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Token inválido o vencido. Solicitá un nuevo correo de verificación.', 400, { code: 'INVALID_OR_EXPIRED_TOKEN' });
  }

  user.isVerified = true;
  user.verification = undefined;
  await user.save();
  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'verification',
    provider: 'local',
    status: 'verified',
    ...buildRequestMetadata(context),
  });

  return {
    type: 'verified',
    message: 'Tu cuenta ha sido verificada. Ahora podés iniciar sesión.',
    user,
  };
};

const authenticateGoogleToken = async (idToken) => {
  const client = ensureGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

const registerWithGoogle = async ({ idToken }, context = {}) => {
  if (!idToken) {
     throw new AppError('Se requiere el token de Google ID', 400, { code: 'GOOGLE_TOKEN_MISSING' });
   }

  const payload = await authenticateGoogleToken(idToken);
  const { sub, email, name, given_name: givenName, email_verified: emailVerified } = payload;

  if (!emailVerified) {
     throw new AppError('El correo de la cuenta de Google no está verificado.', 400, {
       code: 'GOOGLE_EMAIL_NOT_VERIFIED',
     });
   }

  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  const requestMetadata = buildRequestMetadata(context);

  if (!user) {
    user = await User.create({
      fullName: name || givenName || 'Google User',
      email: normalizedEmail,
      providers: [{ provider: 'google', providerId: sub }],
      isVerified: true,
      lastLoginAt: new Date(),
      audit: {
        createdByIp: requestMetadata.ipAddress || null,
        createdByAgent: requestMetadata.userAgent || null,
      },
    });
    const permissionsChanged = ensureBaselinePermissions(user);
    if (permissionsChanged) {
      await user.save();
    }
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'google',
      status: 'verified',
      ...requestMetadata,
    });
    const session = await issueSession({ user, context, rememberMe: false });
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: 'google',
      status: 'login_success',
      ...requestMetadata,
    });
    return {
       type: 'google_registered',
       message: 'Cuenta creada con Google. Sesión iniciada.',
       user,
       session,
     };
  }

  const hadLocalProvider = user.hasProvider('local');
  user.addProvider('google', sub);
  user.fullName = user.fullName || name || givenName || user.fullName;
  user.isVerified = true;
  user.verification = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastFailedLoginAt = undefined;
  user.lastLoginAt = new Date();
  ensureBaselinePermissions(user);
  if (!user.audit || (!user.audit.createdByIp && !user.audit.createdByAgent)) {
    user.audit = {
      createdByIp: requestMetadata.ipAddress || null,
      createdByAgent: requestMetadata.userAgent || null,
    };
  }
  await user.save();
  if (hadLocalProvider) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'registration',
      provider: 'google',
      status: 'merged',
      ...requestMetadata,
    });
  }
    const session = await issueSession({ user, context, rememberMe: false });
  if (!hadLocalProvider) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: 'google',
      status: 'login_success',
      ...requestMetadata,
    });
  }

  return {
    type: 'google_linked',
    message: 'Cuenta de Google vinculada. Sesión iniciada.',
    user,
    session,
  };
};

const loginWithEmail = async ({ email, password, rememberMe }, context = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  const requestMetadata = buildRequestMetadata(context);
  const bypassEmails = shouldBypassAuthEmails();

  if (!user || !user.passwordHash) {
    await logSecurityEvent({
      email: normalizedEmail,
      eventType: 'login',
      provider: 'local',
      status: 'login_failure',
      ...requestMetadata,
    });
    throw new AppError('Correo o contraseña incorrectos.', 401, { code: 'INVALID_CREDENTIALS' });
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: 'local',
      status: 'account_locked',
      metadata: { lockUntil: user.lockUntil },
      ...requestMetadata,
    });
    throw new AppError('Demasiados intentos. Tu cuenta está bloqueada por 15 minutos.', 423, {
      code: 'ACCOUNT_LOCKED',
      retryAt: user.lockUntil,
    });
  }

  ensureBaselinePermissions(user);

  const passwordMatches = await bcrypt.compare(password, user.passwordHash || '');
  if (!passwordMatches) {
    const now = new Date();
    const alreadyLocked = user.lockUntil && user.lockUntil > now;
    if (!user.lastFailedLoginAt || now - user.lastFailedLoginAt > LOGIN_WINDOW_MS) {
      user.failedLoginAttempts = 0;
    }
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedLoginAt = now;
    if (user.failedLoginAttempts >= LOGIN_MAX_ATTEMPTS) {
      user.lockUntil = new Date(now.getTime() + LOGIN_LOCK_MINUTES * 60 * 1000);
      await user.save();
      if (!alreadyLocked) {
        sendAccountLockedEmail(user).catch((err) => {
          // eslint-disable-next-line no-console
          logger.error('send_account_locked_email_failed', { message: err.message });
        });
      }
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'login',
        provider: 'local',
        status: 'account_locked',
        metadata: { lockUntil: user.lockUntil },
        ...requestMetadata,
      });
      throw new AppError('Demasiados intentos. Tu cuenta está bloqueada por 15 minutos.', 423, {
        code: 'ACCOUNT_LOCKED',
        retryAt: user.lockUntil,
      });
    }
    await user.save();
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: user.primaryProvider() || 'local',
      status: 'login_failure',
      metadata: { failedLoginAttempts: user.failedLoginAttempts },
      ...requestMetadata,
    });
    throw new AppError('Correo o contraseña incorrectos.', 401, { code: 'INVALID_CREDENTIALS' });
  }

  if (!user.isVerified && !bypassEmails) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'login',
      provider: 'local',
      status: 'pending_verification',
      ...requestMetadata,
    });
    throw new AppError('Tu cuenta no está verificada.', 403, { code: 'ACCOUNT_NOT_VERIFIED' });
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastFailedLoginAt = undefined;
  user.lastLoginAt = new Date();

  const bypassTwoFactor = shouldBypassTwoFactor();
  if (bypassTwoFactor && isTwoFactorEnabled(user)) {
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'two_factor',
      provider: 'local',
      status: 'two_factor_bypassed',
      ...requestMetadata,
    });
  }

  if (!bypassTwoFactor && isTwoFactorEnabled(user)) {
    const { challengeToken, expiresAt } = await createTwoFactorChallenge({
      user,
      rememberMe,
      context,
    });
    await user.save();
    await logSecurityEvent({
      user: user._id,
      email: normalizedEmail,
      eventType: 'two_factor',
      provider: 'local',
      status: 'two_factor_required',
      metadata: { expiresAt },
      ...requestMetadata,
    });
    return {
      type: 'two_factor_required',
      challengeToken,
      expiresAt,
    };
  }

  await user.save();

  const session = await issueSession({ user, rememberMe, context });

  await logSecurityEvent({
    user: user._id,
    email: normalizedEmail,
    eventType: 'login',
    provider: user.primaryProvider() || 'local',
    status: 'login_success',
    ...requestMetadata,
  });

  return {
    type: 'login_success',
    user,
    session,
  };
};

const verifyTwoFactorChallenge = async ({ challengeToken, code }, context = {}) => {
  if (!challengeToken || !code) {
    throw new AppError('Se requieren el desafío de dos pasos y el código.', 400, {
      code: 'TWO_FACTOR_CODE_REQUIRED',
    });
  }

  const hashedToken = hashToken(challengeToken);
  const challenge = await TwoFactorChallenge.findOne({
    token: hashedToken,
    $or: [{ purpose: 'login' }, { purpose: { $exists: false } }],
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    if (challenge) {
      await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    }
    throw new AppError('Código inválido o vencido.', 400, {
      code: 'INVALID_TWO_FACTOR',
    });
  }

  const user = await User.findById(challenge.user);
  if (!user) {
    await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    throw new AppError('Código inválido o vencido.', 400, {
      code: 'INVALID_TWO_FACTOR',
    });
  }

  const codeHash = hashToken(code);
  if (challenge.codeHash !== codeHash) {
    await logSecurityEvent({
      user: user._id,
      email: user.email,
      eventType: 'two_factor',
      provider: 'local',
      status: 'two_factor_failed',
      ...challenge.metadata,
    });
    throw new AppError('Código inválido o vencido. Intentá nuevamente.', 400, {
      code: 'INVALID_TWO_FACTOR',
    });
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastFailedLoginAt = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await TwoFactorChallenge.deleteOne({ _id: challenge._id });

  const rememberMe = Boolean(challenge.rememberMe);
  const session = await issueSession({ user, rememberMe, context });
  const metadata = challenge.metadata || buildRequestMetadata(context);

  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'two_factor',
    provider: 'local',
    status: 'two_factor_verified',
    ...metadata,
  });
  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'login',
    provider: user.primaryProvider() || 'local',
    status: 'login_success',
    ...metadata,
  });

  return {
    type: 'login_success',
    user,
    session,
  };
};

const verifyTwoFactorToggleChallenge = async ({ user, challengeToken, code }, context = {}) => {
  if (!user || !challengeToken || !code) {
    throw new AppError('Se requieren el desafío de dos pasos y el código.', 400, {
      code: 'TWO_FACTOR_CODE_REQUIRED',
    });
  }

  const hashedToken = hashToken(challengeToken);
  const challenge = await TwoFactorChallenge.findOne({
    token: hashedToken,
    user: user._id,
    purpose: 'toggle_2fa',
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    if (challenge) {
      await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    }
    throw new AppError('Código inválido o vencido.', 400, {
      code: 'INVALID_TWO_FACTOR',
    });
  }

  const codeHash = hashToken(code);
  if (challenge.codeHash !== codeHash) {
    await logSecurityEvent({
      user: user._id,
      email: user.email,
      eventType: 'two_factor_toggle',
      provider: user.primaryProvider() || 'local',
      status: 'two_factor_failed',
      ...challenge.metadata,
    });
    throw new AppError('Código inválido o vencido. Intentá nuevamente.', 400, {
      code: 'INVALID_TWO_FACTOR',
    });
  }

  user.twoFactor = user.twoFactor || {};
  user.twoFactor.enabled = Boolean(challenge.toggleEnabledTarget);
  await user.save();

  await TwoFactorChallenge.deleteOne({ _id: challenge._id });
  const metadata = challenge.metadata || buildRequestMetadata(context);

  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'two_factor_toggle',
    provider: user.primaryProvider() || 'local',
    status: user.twoFactor.enabled ? 'two_factor_enabled' : 'two_factor_disabled',
    ...metadata,
  });

  return {
    user,
    enabled: Boolean(user.twoFactor.enabled),
  };
};

const resendTwoFactorCode = async ({ challengeToken }, context = {}) => {
  if (!challengeToken) {
    throw new AppError('Se requiere el token del desafío de dos pasos.', 400, {
      code: 'TWO_FACTOR_CHALLENGE_REQUIRED',
    });
  }

  const hashedToken = hashToken(challengeToken);
  const challenge = await TwoFactorChallenge.findOne({
    token: hashedToken,
    $or: [{ purpose: 'login' }, { purpose: { $exists: false } }],
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    if (challenge) {
      await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    }
    throw new AppError('The verification window expired. Please start again.', 400, {
      code: 'TWO_FACTOR_EXPIRED',
    });
  }

  const user = await User.findById(challenge.user);
  if (!user) {
    await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    throw new AppError('The verification window expired. Please start again.', 400, {
      code: 'TWO_FACTOR_EXPIRED',
    });
  }

  const code = generateTwoFactorCode();
  challenge.codeHash = hashToken(code);
  challenge.expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);
  challenge.metadata = buildRequestMetadata(context);
  await challenge.save();

  await sendTwoFactorCodeEmail(user, code);
  const metadata = challenge.metadata || buildRequestMetadata(context);

  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'two_factor',
    provider: 'local',
    status: 'two_factor_required',
    ...metadata,
  });

  return {
    message: 'Código reenviado.',
  };
};

const resendTwoFactorToggleCode = async ({ user, challengeToken }, context = {}) => {
  if (!user || !challengeToken) {
    throw new AppError('Se requiere el token del desafío de dos pasos.', 400, {
      code: 'TWO_FACTOR_CHALLENGE_REQUIRED',
    });
  }

  if (shouldBypassAuthEmails()) {
    throw new AppError('La verificacion por email esta deshabilitada por configuracion.', 400, {
      code: 'EMAIL_VERIFICATION_DISABLED',
    });
  }

  const hashedToken = hashToken(challengeToken);
  const challenge = await TwoFactorChallenge.findOne({
    token: hashedToken,
    user: user._id,
    purpose: 'toggle_2fa',
  });

  if (!challenge || challenge.expiresAt < new Date()) {
    if (challenge) {
      await TwoFactorChallenge.deleteOne({ _id: challenge._id });
    }
    throw new AppError('La ventana de verificacion expiro. Inicia nuevamente.', 400, {
      code: 'TWO_FACTOR_EXPIRED',
    });
  }

  const code = generateTwoFactorCode();
  challenge.codeHash = hashToken(code);
  challenge.expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_DURATION_MINUTES * 60 * 1000);
  challenge.metadata = buildRequestMetadata(context);
  await challenge.save();

  try {
    await sendTwoFactorToggleCodeEmail(user, code, Boolean(challenge.toggleEnabledTarget));
  } catch (error) {
    logger.error('resend_2fa_toggle_email_failed', { message: error?.message, code: error?.code });
    throw mapTwoFactorToggleEmailError(error);
  }

  return {
    message: 'Código reenviado.',
  };
};

const resendVerificationEmail = async ({ email }, context = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  const requestMetadata = buildRequestMetadata(context);
  const bypassEmails = shouldBypassAuthEmails();

  if (!user) {
    return {
      message: 'Si existe una cuenta con este email, reenviamos el enlace de verificación.',
    };
  }

  if (user.isVerified) {
    return {
      message: 'Esta cuenta ya está verificada.',
    };
  }

  if (bypassEmails) {
    logger.warn('email_verification_bypassed', { email: normalizedEmail });
    return {
      message: 'La verificacion por email esta deshabilitada por configuracion.',
    };
  }

  const { plainToken, verificationPayload } = buildVerificationDetails();
  user.verification = verificationPayload;
  await user.save();
  try {
    await sendVerificationEmail(user, plainToken);
  } catch (error) {
    // eslint-disable-next-line no-console
    logger.error('resend_verification_email_failed', { message: error.message });
    throw new AppError('No se pudo reenviar el email de verificación.', 502, {
      code: 'VERIFICATION_EMAIL_FAILED',
    });
  }
  await logSecurityEvent({
    user: user._id,
    email: normalizedEmail,
    eventType: 'resend_verification',
    provider: user.primaryProvider() || 'local',
    status: 'verification_resent',
    ...requestMetadata,
  });

  return {
    message: 'Email de verificación enviado.',
  };
};

const requestPasswordReset = async ({ email }, context = {}) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const requestMetadata = buildRequestMetadata(context);
  const user = await User.findOne({ email: normalizedEmail });
  const bypassEmails = shouldBypassAuthEmails();

  if (bypassEmails) {
    logger.warn('password_reset_bypassed', { email: normalizedEmail });
    return {
      message: 'Si existe una cuenta con este email, reenviamos el enlace de recuperaciÃ³n.',
    };
  }

  if (user) {
    const { plainToken, resetPayload } = buildPasswordResetDetails();
    user.passwordReset = resetPayload;
    await user.save();
    try {
      await sendPasswordResetEmail(user, plainToken);
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'password_reset',
        provider: user.primaryProvider() || 'local',
        status: 'reset_requested',
        ...requestMetadata,
      });
    } catch (error) {
      // Do not leak transport errors to clients or allow account enumeration.
      // Log the failure for observability and continue returning generic success.
      // eslint-disable-next-line no-console
      logger.error('send_password_reset_email_failed', { message: error.message });
      await logSecurityEvent({
        user: user._id,
        email: normalizedEmail,
        eventType: 'password_reset',
        provider: user.primaryProvider() || 'local',
        status: 'reset_email_failed',
        metadata: { errorCode: error?.code, errorMessage: error?.message },
        ...requestMetadata,
      });
    }
  }

  return {
    message: 'Si existe una cuenta con este email, reenviamos el enlace de recuperación.',
  };
};

const validatePasswordResetToken = async ({ token }, context = {}) => {
  if (!token) {
    throw new AppError('Enlace inválido o expirado.', 400, {
      code: 'RESET_TOKEN_INVALID',
    });
  }

  const hashed = hashToken(token);
  const now = new Date();
  const user = await User.findOne({
    'passwordReset.token': hashed,
    'passwordReset.expiresAt': { $gt: now },
  });

  if (!user) {
    const fallbackUser = await User.findOne({ 'passwordReset.token': hashed });
    if (fallbackUser) {
      await logSecurityEvent({
        user: fallbackUser._id,
        email: fallbackUser.email,
        eventType: 'password_reset',
        provider: fallbackUser.primaryProvider() || 'local',
        status: 'reset_invalid',
        ...buildRequestMetadata(context),
      });
    }
    throw new AppError('Enlace inválido o expirado.', 400, {
      code: 'RESET_TOKEN_INVALID',
    });
  }

  return { message: 'Token válido.' };
};

const resetPassword = async ({ token, password }, context = {}) => {
  if (!token) {
    throw new AppError('Enlace inválido o expirado.', 400, {
      code: 'RESET_TOKEN_INVALID',
    });
  }

  const hashed = hashToken(token);
  const now = new Date();
  const user = await User.findOne({
    'passwordReset.token': hashed,
    'passwordReset.expiresAt': { $gt: now },
  });

  if (!user) {
    const fallbackUser = await User.findOne({ 'passwordReset.token': hashed });
    if (fallbackUser) {
      await logSecurityEvent({
        user: fallbackUser._id,
        email: fallbackUser.email,
        eventType: 'password_reset',
        provider: fallbackUser.primaryProvider() || 'local',
        status: 'reset_invalid',
        ...buildRequestMetadata(context),
      });
    }
    throw new AppError('Enlace inválido o expirado.', 400, {
      code: 'RESET_TOKEN_INVALID',
    });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.passwordHash = passwordHash;
  user.passwordReset = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastFailedLoginAt = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await deleteSessionsByUser(user._id);

  await logSecurityEvent({
    user: user._id,
    email: user.email,
    eventType: 'password_reset',
    provider: user.primaryProvider() || 'local',
    status: 'reset_completed',
    ...buildRequestMetadata(context),
  });

  return {
    message: 'Tu contraseña fue actualizada. Iniciá sesión con tu nueva clave.',
  };
};

module.exports = {
  registerLocal,
  verifyEmailToken,
  registerWithGoogle,
  loginWithEmail,
  verifyTwoFactorChallenge,
  resendTwoFactorCode,
  createTwoFactorToggleChallenge,
  verifyTwoFactorToggleChallenge,
  resendTwoFactorToggleCode,
  resendVerificationEmail,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
};

