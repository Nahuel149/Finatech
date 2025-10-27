import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';

type VerificationStatus = 'loading' | 'success' | 'error';

const useQueryToken = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return params.get('token') || '';
};

export const VerifyEmailPage: React.FC = () => {
  const token = useQueryToken();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string>('Verificando tu cuenta…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token inválido. Solicitá un nuevo correo de verificación.');
      return;
    }

    const verify = async () => {
      setStatus('loading');
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Token inválido o vencido. Solicitá un nuevo correo de verificación.');
        }

        setStatus('success');
        setMessage(data.message || 'Tu cuenta fue verificada. Ya podés iniciar sesión.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'No pudimos verificar tu cuenta. Pedí un nuevo correo e intentá nuevamente.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <MinimalHeader onCreateAccountClick={() => navigate('/register')} />
      <main className="flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  status === 'success'
                    ? 'bg-success bg-opacity-10 text-success'
                    : status === 'error'
                    ? 'bg-danger bg-opacity-10 text-danger'
                    : 'bg-primary bg-opacity-10 text-primary'
                }`}
              >
                {status === 'loading' && <i className="fa-solid fa-spinner fa-spin text-2xl" />}
                {status === 'success' && <i className="fa-solid fa-circle-check text-2xl" />}
                {status === 'error' && <i className="fa-solid fa-triangle-exclamation text-2xl" />}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {status === 'success' ? '¡Cuenta verificada!' : status === 'error' ? 'No pudimos verificar tu cuenta' : 'Verificando…'}
              </h1>
              <p className="text-sm text-gray-600">{message}</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-sm"
              >
                Ir a iniciar sesión
              </button>
              {status === 'error' && (
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  Solicitar un nuevo correo
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
