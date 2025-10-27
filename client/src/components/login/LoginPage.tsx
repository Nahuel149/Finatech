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
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [challengeId, setChallengeId] = useState<string>('');
  const [lastEmail, setLastEmail] = useState('');
  const [loginError, setLoginError] = useState<string>('');
  const [rateLimitError, setRateLimitError] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string>('');
  const [showUnverifiedBanner, setShowUnverifiedBanner] = useState(false);
  const [unverifiedBannerTitle, setUnverifiedBannerTitle] = useState('');
  const [unverifiedBannerText, setUnverifiedBannerText] = useState('');

  const handleGoogleResponse = useCallback(
    async (response: any) => {
      setIsLoading(true);
      setLoginError('');

      try {
        const result = await googleAuth(response.credential);

        if (result.success) {
          if (result.requiresTwoFactor) {
            setLoginError('La autenticación de dos factores con Google no está soportada actualmente.');
          } else {
            navigate('/dashboard');
          }
        } else {
          setLoginError(result.message || 'Error al iniciar sesión con Google.');
        }
      } catch (error: any) {
        setLoginError(error.message || 'Error de conexión con Google. Intentá de nuevo.');
      } finally {
        setIsLoading(false);
      }
    },
    [googleAuth, navigate],
  );

  // Google Sign-In initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && config?.googleClientId) {
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: handleGoogleResponse,
      });
    }
  }, [config?.googleClientId, handleGoogleResponse]);

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

  // Handle Google Sign-In button click
  const handleGoogleClick = () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.prompt();
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
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
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
              onClick={handleGoogleClick}
              isLoading={isLoading}
            />
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
