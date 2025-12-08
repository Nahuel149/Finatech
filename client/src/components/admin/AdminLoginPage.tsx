import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinimalHeader } from '../login/MinimalHeader';
import { LoginForm } from '../login/LoginForm';
import { TwoFactorModal } from '../login/TwoFactorModal';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../ui/Alert';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, verifyTwoFactor } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [challengeId, setChallengeId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [twoFactorError, setTwoFactorError] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string | null>('Solo administradores pueden entrar a este panel.');

  const handleLoginSubmit = async (formData: LoginFormData) => {
    setIsLoading(true);
    setLoginError('');

    try {
      const result = await login(formData);

      if (result.success && result.requiresTwoFactor && result.challengeId) {
        setChallengeId(result.challengeId);
        setShowTwoFactor(true);
        return;
      }

      if (result.success) {
        navigate('/admin');
        return;
      }

      setLoginError(result.message || 'No pudimos iniciar sesion como administrador.');
    } catch (error: any) {
      setLoginError(error.message || 'No pudimos iniciar sesion como administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (code: string) => {
    setIsLoading(true);
    setTwoFactorError('');

    try {
      const result = await verifyTwoFactor({
        code,
        challengeId,
      });

      if (result.success) {
        navigate('/admin');
        return;
      }

      setTwoFactorError(result.message || 'No pudimos validar el codigo.');
    } catch (error: any) {
      setTwoFactorError(error.message || 'No pudimos validar el codigo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setChallengeId('');
    setTwoFactorError('');
  };

  const handleForgotPasswordClick = () => {
    navigate('/recover');
  };

  const goToMainLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MinimalHeader
        onCreateAccountClick={goToMainLogin}
        ctaLabel="Volver al login"
      />

      <main className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Panel interno</p>
              <h1 className="text-xl font-bold text-slate-900">Acceso de administracion</h1>
              <p className="text-sm text-slate-600 mt-1">
                Usar las mismas credenciales que el resto de la aplicacion.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {infoMessage && (
                <Alert
                  type="info"
                  message={infoMessage}
                  onClose={() => setInfoMessage(null)}
                />
              )}
              <LoginForm
                onSubmit={handleLoginSubmit}
                onForgotPasswordClick={handleForgotPasswordClick}
                isLoading={isLoading}
                loginError={loginError}
                rateLimitError={undefined}
                showUnverifiedBanner={false}
              />
            </div>
          </div>
        </div>
      </main>

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
