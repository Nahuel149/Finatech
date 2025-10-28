import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { ApiError } from '../../types';

const isValidEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const RecoveryRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');

  const recoverApi = useApi<any>('/api/auth/recover', {
    onSuccess: () => setSuccess(true),
    onError: (err: ApiError) => setErrorText(err.message || 'Hubo un problema al enviar las instrucciones.'),
  });

  const hideError = () => setErrorText('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    hideError();
    setSuccess(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorText('Por favor ingresá tu email.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setErrorText('Ingresá un email válido.');
      return;
    }

    try {
      await recoverApi.execute({
        method: 'POST',
        body: { email: trimmedEmail },
      });
    } catch (err: any) {
      // error handled via onError; add details-aware fallback just in case
      const message = (err && err.message) || 'Hubo un problema al enviar las instrucciones.';
      setErrorText(message);
    }
  };

  const loading = recoverApi.loading;

  return (
    <main id="main-container" className="px-4 py-6 sm:px-6 md:px-4">
      <div className="max-w-md mx-auto">
        <div id="recovery-card" className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
          <div className="p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fa-solid fa-key text-primary text-base sm:text-lg"></i>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-text-primary mb-2">Recuperar contraseña</h1>
              <p className="text-gray-600 text-xs sm:text-sm">Ingresá tu email para recibir instrucciones de recuperación</p>
            </div>

            <form id="recovery-form" className="space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
              <div id="email-field">
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={success}
                  className="mobile-input touch-friendly w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {errorText && (
                <div id="recovery-error" className="p-3 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
                  <div className="flex items-center">
                    <i className="fa-solid fa-exclamation-circle text-danger mr-2"></i>
                    <span id="recovery-error-text" className="text-xs sm:text-sm text-red-700">{errorText}</span>
                  </div>
                </div>
              )}

              {success && (
                <div id="recovery-success" className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg" aria-live="polite">
                  <div className="flex items-center">
                    <i className="fa-solid fa-envelope-circle-check text-primary mr-2 sm:mr-3"></i>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-800">Instrucciones enviadas</p>
                      <p className="text-xs sm:text-sm text-blue-700">Si el email existe, te enviamos instrucciones para resetear tu contraseña.</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                id="recovery-button"
                disabled={loading || success}
                className="mobile-button touch-friendly w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                <span id="recovery-button-text">{loading ? 'Enviando...' : 'Enviar instrucciones'}</span>
                {loading && <i id="recovery-button-loading" className="fa-solid fa-spinner fa-spin ml-2"></i>}
              </button>
            </form>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              <button
                onClick={() => navigate('/login')}
                className="touch-friendly text-primary hover:underline font-medium cursor-pointer"
                type="button"
              >
                Volver a Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};