import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';
import { LoginForm } from './LoginForm';
import { GoogleLoginButton } from './GoogleLoginButton';
import { TwoFactorModal } from './TwoFactorModal';
import { useAuth } from '../../hooks/useAuth';
import { useConfig } from '../../hooks/useConfig';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, googleAuth, verifyTwoFactor, resendVerification } = useAuth();
  const { config } = useConfig();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [challengeId, setChallengeId] = useState<string>('');
  const [lastEmail, setLastEmail] = useState('');
  const [loginError, setLoginError] = useState<string>('');
  const [rateLimitError, setRateLimitError] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string>('');
  const [showUnverifiedBanner, setShowUnverifiedBanner] = useState(false);
  const [unverifiedBannerTitle, setUnverifiedBannerTitle] = useState('');
  const [unverifiedBannerText, setUnverifiedBannerText] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (sessionStorage.getItem('finatech_idle_logout') === '1') {
      setLoginError('Sesión expirada por inactividad. Volvé a iniciar sesión.');
      sessionStorage.removeItem('finatech_idle_logout');
    }
  }, []);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      if (!credential) {
        setLoginError('No recibimos credenciales de Google. Intentá de nuevo.');
        return;
      }
      setIsGoogleLoading(true);
      setLoginError('');
      setRateLimitError('');

      try {
        const result = await googleAuth(credential);

        if (result.success) {
          if (result.requiresTwoFactor) {
            if (!result.challengeId) {
              setLoginError('No pudimos iniciar el desafío de dos pasos. Intentá nuevamente.');
              return;
            }
            setChallengeId(result.challengeId);
            setShowTwoFactor(true);
          } else {
            navigate('/dashboard');
          }
        } else {
          setLoginError(result.message || 'Error al iniciar sesión con Google.');
        }
      } catch (error: any) {
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
          setRateLimitError(error.message || 'Demasiados intentos. Intentá de nuevo más tarde.');
        } else {
          setLoginError(error.message || 'Error de conexión con Google. Intentá de nuevo.');
        }
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [googleAuth, navigate],
  );

  // Handle regular login form submission
  const handleLoginSubmit = async (formData: LoginFormData) => {
    setIsLoading(true);
    setLoginError('');
    setRateLimitError('');
    setShowUnverifiedBanner(false);

    try {
      setLastEmail(formData.email);
      const result = await login(formData);

      if (result.success) {
        if (result.requiresTwoFactor && result.challengeId) {
          setChallengeId(result.challengeId);
          setShowTwoFactor(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        setLoginError(result.message || 'Error al iniciar sesión.');
      }
    } catch (error: any) {
      if (error.code === 'ACCOUNT_NOT_VERIFIED') {
        setShowUnverifiedBanner(true);
        setUnverifiedBannerTitle('Cuenta no verificada');
        setUnverifiedBannerText('Revisá tu correo para confirmar tu cuenta.');
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        setRateLimitError(error.message || 'Demasiados intentos. Intentá de nuevo más tarde.');
      } else {
        setLoginError(error.message || 'Error de conexión. Intentá de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle two-factor authentication submission
  const handleTwoFactorSubmit = async (code: string) => {
    setIsLoading(true);
    setTwoFactorError('');

    try {
      const result = await verifyTwoFactor({
        code,
        challengeId: challengeId
      });

      if (result.success) {
        navigate('/dashboard');
      } else {
        setTwoFactorError(result.message || 'Código de verificación incorrecto.');
      }
    } catch (error: any) {
      setTwoFactorError(error.message || 'Error al verificar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to login from 2FA
  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setChallengeId('');
    setTwoFactorError('');
  };

  // Handle create account navigation
  const handleCreateAccountClick = () => {
    navigate('/register');
  };

  // Handle forgot password
  const handleForgotPasswordClick = () => {
    navigate('/recover');
  };

  // Handle resend verification
  const handleResendVerification = async () => {
    try {
      await resendVerification(lastEmail);
      setUnverifiedBannerTitle('Correo reenviado');
      setUnverifiedBannerText('Revisá tu bandeja de entrada y seguí las instrucciones.');
    } catch (error) {
      setUnverifiedBannerTitle('Error al reenviar');
      setUnverifiedBannerText('No se pudo reenviar el correo. Intentá de nuevo más tarde.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <MinimalHeader onCreateAccountClick={handleCreateAccountClick} />

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
            {/* Login Form */}
            <LoginForm
              onSubmit={handleLoginSubmit}
              onForgotPasswordClick={handleForgotPasswordClick}
              isLoading={isLoading}
              loginError={loginError}
              rateLimitError={rateLimitError}
              showUnverifiedBanner={showUnverifiedBanner}
              unverifiedBannerTitle={unverifiedBannerTitle}
              unverifiedBannerText={unverifiedBannerText}
              onResendVerification={handleResendVerification}
            />

            {/* Google Login Button */}
            <GoogleLoginButton
              clientId={config?.googleClientId}
              onCredential={handleGoogleCredential}
              onUnavailable={setLoginError}
              isLoading={isGoogleLoading}
            />

            {/* Register Link */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg text-center">
              <p className="text-sm text-gray-600">
                ¿No tenés cuenta?{' '}
                <button
                  type="button"
                  onClick={handleCreateAccountClick}
                  className="text-primary hover:underline font-medium"
                >
                  Crear cuenta
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Two Factor Modal */}
      <TwoFactorModal
        isOpen={showTwoFactor}
        onSubmit={handleTwoFactorSubmit}
        onBack={handleBackToLogin}
        isLoading={isLoading}
        error={twoFactorError}
      />
    </div>
  );
};
