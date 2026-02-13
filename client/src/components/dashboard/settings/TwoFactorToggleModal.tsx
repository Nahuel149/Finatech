import React, { useEffect, useState } from 'react';
import { Modal } from '../../ui/Modal';

interface TwoFactorToggleModalProps {
  isOpen: boolean;
  actionLabel: string; // 'activar' | 'desactivar'
  onClose: () => void;
  onSubmit: (code: string) => void;
  onResend?: () => void;
  isSubmitting: boolean;
  isResending?: boolean;
  error?: string;
}

export const TwoFactorToggleModal: React.FC<TwoFactorToggleModalProps> = ({
  isOpen,
  actionLabel,
  onClose,
  onSubmit,
  onResend,
  isSubmitting,
  isResending = false,
  error,
}) => {
  const [code, setCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCode('');
    }
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(code);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar cambio de 2FA" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Te enviamos un codigo de 6 digitos a tu correo. Ingresalo para {actionLabel} la autenticacion en dos pasos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="two-factor-toggle-code" className="block text-sm font-medium text-gray-700 mb-2">
              Codigo de verificacion
            </label>
            <input
              id="two-factor-toggle-code"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm text-center tracking-widest"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              autoComplete="one-time-code"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
              <div className="flex items-center">
                <i className="fa-solid fa-exclamation-circle text-danger mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-between items-center">
            {onResend ? (
              <button
                type="button"
                onClick={onResend}
                disabled={isSubmitting || isResending}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isResending ? 'Reenviando...' : 'Reenviar codigo'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    Confirmando...
                    <i className="fa-solid fa-spinner fa-spin ml-2" />
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

