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

  const handleGoogleResponse = useCallback(
    async (response: any) => {
      setIsGoogleLoading(true);
      setLoginError('');
      setRateLimitError('');

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

  // Google Sign-In initialization with proper timing
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id && config?.googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true,
          });
          return true;
        } catch (error) {
          console.error('Error initializing Google Sign-In:', error);
          return false;
        }
      }
      return false;
    };

    // If config is available, try to initialize immediately
    if (config?.googleClientId) {
      if (initializeGoogleSignIn()) {
        return; // Successfully initialized
      }

      // If Google script isn't loaded yet, wait for it
      const checkGoogleScript = () => {
        if (window.google?.accounts?.id) {
          initializeGoogleSignIn();
        } else {
          // Check again in 100ms
          setTimeout(checkGoogleScript, 100);
        }
      };

      checkGoogleScript();
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
    if (!config?.googleClientId) {
      setLoginError('Google Sign-In no está configurado. Contactá al administrador.');
      return;
    }

    setIsGoogleLoading(true);
    setLoginError('');
    setRateLimitError('');

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        // Re-initialize if needed
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        // Try to show the prompt first
        window.google.accounts.id.prompt((notification) => {
          // Only show an error if the prompt could not be displayed at all. We silently
          // ignore user-initiated dismiss/skip moments to avoid flashing a cancellation
          // message when the sign-in actually succeeds shortly afterwards.
          if (typeof notification.isNotDisplayed === 'function' && notification.isNotDisplayed()) {
            setLoginError('Google Sign-In no pudo mostrarse. Intentá de nuevo.');
          }
          setIsGoogleLoading(false);
        });
      } catch (error) {
        console.error('Error showing Google Sign-In prompt:', error);
        setLoginError('Error al cargar Google Sign-In. Intentá de nuevo.');
        setIsGoogleLoading(false);
      }
    } else {
      setLoginError('Google Sign-In no está disponible. Verificá tu conexión e intentá de nuevo.');
      setIsGoogleLoading(false);
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
              onClick={handleGoogleClick}
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
