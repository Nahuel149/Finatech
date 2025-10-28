import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { ApiError } from '../../types';

const isValidPassword = (value: string): boolean => {
  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
};

interface PasswordResetFormProps {
  token: string;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ token }) => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const validateApi = useApi<any>(`/api/auth/reset/validate?token=${encodeURIComponent(token)}`, {
    onError: () => setInvalidToken(true),
  });

  const { loading: validateLoading, execute: validateTokenRequest } = validateApi;

  const resetApi = useApi<any>('/api/auth/reset', {
    onSuccess: () => setSuccess(true),
    onError: (err: ApiError) => {
      if (err?.code === 'RESET_TOKEN_INVALID') {
        setInvalidToken(true);
        return;
      }
      const message = err?.message || 'No pudimos actualizar la contraseña. Intentá nuevamente.';
      setErrorText(message);
    },
  });

  useEffect(() => {
    setPasswordsMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      setInvalidToken(false);
      setErrorText('');
      try {
        await validateTokenRequest({ method: 'GET' });
      } catch {
        // handled by onError
      }
    };

    if (token) validateToken();
  }, [token, validateTokenRequest]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorText('');
    setSuccess(false);

    if (!token) {
      setInvalidToken(true);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorText('Por favor completá todos los campos.');
      return;
    }
    if (!isValidPassword(newPassword)) {
      setErrorText('La contraseña no cumple con los requisitos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorText('Las contraseñas no coinciden.');
      return;
    }

    try {
      await resetApi.execute({
        method: 'POST',
        body: { token, password: newPassword, confirmPassword },
      });
    } catch {
      // handled by onError
    }
  };

  const loading = validateLoading || resetApi.loading;

  return (
    <div id="reset-container" className="px-4 py-6 sm:px-6 md:px-4">
      <div className="max-w-md mx-auto">
        <div id="reset-card" className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
          <div className="p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fa-solid fa-lock-open text-primary text-base sm:text-lg"></i>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-2">Definir nueva contraseña</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Creá una contraseña segura para tu cuenta</p>
            </div>

            {invalidToken && (
              <div id="invalid-token-banner" className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
                <div className="flex items-center">
                  <i className="fa-solid fa-exclamation-triangle text-red-600 mr-2 sm:mr-3"></i>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-red-800">Enlace inválido o expirado</p>
                    <p className="text-xs sm:text-sm text-red-700">Solicitá un nuevo enlace para restablecer tu contraseña.</p>
                  </div>
                </div>
                <button
                  id="new-link-button"
                  className="mobile-button touch-friendly mt-3 w-full bg-red-600 text-white px-4 py-2 rounded text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
                  type="button"
                  onClick={() => navigate('/recover')}
                >
                  Generar un nuevo enlace
                </button>
              </div>
            )}

            <form id="reset-form" className="space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
              <div id="new-password-field">
                <label htmlFor="new-password" className="block text-xs sm:text-sm font-medium text-text-primary mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="new-password"
                    name="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mobile-input touch-friendly w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                    placeholder="Ingresá tu nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-new-password"
                    onClick={() => setShowNewPassword((s) => !s)}
                    className="touch-friendly absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fa-solid fa-eye text-sm"></i>
                  </button>
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  <p className="mb-1">La contraseña debe contener:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center">
                      <i className={`fa-solid ${newPassword.length >= 8 ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'} mr-2 w-3`}></i>
                      Mínimo 8 caracteres
                    </li>
                    <li className="flex items-center">
                      <i className={`fa-solid ${/[A-Z]/.test(newPassword) ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'} mr-2 w-3`}></i>
                      Una letra mayúscula
                    </li>
                    <li className="flex items-center">
                      <i className={`fa-solid ${/[a-z]/.test(newPassword) ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'} mr-2 w-3`}></i>
                      Una letra minúscula
                    </li>
                    <li className="flex items-center">
                      <i className={`fa-solid ${/[0-9]/.test(newPassword) ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'} mr-2 w-3`}></i>
                      Un número
                    </li>
                  </ul>
                </div>
              </div>

              <div id="confirm-password-field">
                <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-medium text-text-primary mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-password"
                    name="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mobile-input touch-friendly w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                    placeholder="Confirmá tu nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    id="toggle-confirm-password"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="touch-friendly absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fa-solid fa-eye text-sm"></i>
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-2 text-xs sm:text-sm">
                    {newPassword === confirmPassword ? (
                      <div className="flex items-center text-green-600">
                        <i className="fa-solid fa-circle-check mr-2"></i>
                        Las contraseñas coinciden
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <i className="fa-solid fa-circle-xmark mr-2"></i>
                        Las contraseñas no coinciden
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errorText && (
                <div id="reset-error" className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
                  <div className="flex items-center">
                    <i className="fa-solid fa-exclamation-circle text-danger mr-2 sm:mr-3"></i>
                    <span id="reset-error-text" className="text-xs sm:text-sm text-red-700">{errorText}</span>
                  </div>
                </div>
              )}

              {success && (
                <div id="reset-success" className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg" aria-live="polite">
                  <div className="flex items-center">
                    <i className="fa-solid fa-check-circle text-success mr-2 sm:mr-3"></i>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-800">Contraseña actualizada</p>
                      <p className="text-xs sm:text-sm text-green-700">Tu contraseña fue actualizada. Iniciá sesión con tu nueva clave.</p>
                    </div>
                  </div>
                  <button
                    id="go-to-login"
                    className="mt-3 w-full bg-success text-white px-4 py-2 rounded text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors"
                    type="button"
                    onClick={() => navigate('/login')}
                  >
                    Ir a Iniciar sesión
                  </button>
                </div>
              )}

              <button
                id="reset-button"
                type="submit"
                disabled={loading || invalidToken}
                className="mobile-button touch-friendly w-full bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Actualizando...
                  </div>
                ) : (
                  'Actualizar contraseña'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
