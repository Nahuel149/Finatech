import React, { useState } from 'react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onSubmit,
  onBack,
  isLoading,
  error
}) => {
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(twoFactorCode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwoFactorCode(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div id="two-factor-form" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">Verificación en dos pasos</h2>
            <p className="text-gray-600 text-sm">
              Ingresá el código de 6 dígitos de tu aplicación de autenticación
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two Factor Code Input */}
            <div>
              <label htmlFor="two-factor-code" className="block text-sm font-medium text-text-primary mb-2">
                Código de verificación
              </label>
              <input 
                type="text" 
                id="two-factor-code" 
                name="twoFactorCode"
                value={twoFactorCode}
                onChange={handleInputChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm text-center tracking-widest"
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoComplete="one-time-code"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div id="two-factor-error" className="p-3 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
                <div className="flex items-center">
                  <i className="fa-solid fa-exclamation-circle text-danger mr-2"></i>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button 
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors text-sm"
              >
                Volver
              </button>
              <button 
                type="submit"
                disabled={isLoading || twoFactorCode.length !== 6}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    Verificando...
                    <i className="fa-solid fa-spinner fa-spin ml-2"></i>
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};