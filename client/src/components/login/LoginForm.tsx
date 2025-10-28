import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSubmit: (formData: LoginFormData) => void;
  onForgotPasswordClick: () => void;
  isLoading: boolean;
  loginError?: string;
  rateLimitError?: string;
  showUnverifiedBanner?: boolean;
  unverifiedBannerTitle?: string;
  unverifiedBannerText?: string;
  onResendVerification?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onForgotPasswordClick,
  isLoading,
  loginError,
  rateLimitError,
  showUnverifiedBanner,
  unverifiedBannerTitle,
  unverifiedBannerText,
  onResendVerification
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="p-6 md:p-6">
      {/* Form Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-text-primary mb-2 md:text-xl">Iniciar sesión</h1>
          <p className="text-gray-600 text-sm md:text-sm">Ingresá a tu cuenta para continuar</p>
        </div>

      {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2 md:text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm mobile-input touch-friendly md:px-3 md:py-3 md:text-sm"
              placeholder="tu@email.com"
            />
          </div>

        {/* Password Field */}
        <div id="password-field">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2 md:text-sm">
            Contraseña
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              id="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm mobile-input touch-friendly md:px-3 md:py-3 md:text-sm"
              placeholder="Tu contraseña"
              required
            />
            <button 
              type="button" 
              id="toggle-password"
              onClick={togglePassword}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 touch-friendly"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div id="login-options" className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              id="rememberMe" 
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded touch-friendly"
            />
            <span className="ml-2 text-sm text-gray-600 md:text-sm">Recordarme</span>
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-primary hover:underline touch-friendly text-left md:text-right md:text-sm"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Error Messages */}
        {loginError && (
          <div id="login-error" className="p-3 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
            <div className="flex items-center">
              <i className="fa-solid fa-exclamation-circle text-danger mr-2"></i>
              <span id="login-error-text" className="text-sm text-red-700">{loginError}</span>
            </div>
          </div>
        )}

        {/* Rate Limit Error */}
        {rateLimitError && (
          <div id="rate-limit-error" className="p-3 bg-red-50 border border-red-200 rounded-lg" aria-live="polite">
            <div className="flex items-center">
              <i className="fa-solid fa-clock text-danger mr-2"></i>
              <span id="rate-limit-error-text" className="text-sm text-red-700">{rateLimitError}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
          <button
            type="submit" 
            id="login-button"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mobile-button touch-friendly md:py-3 md:px-4 md:text-sm"
          >
            <span id="login-button-text">{isLoading ? 'Ingresando...' : 'Ingresar'}</span>
            {isLoading && <i id="login-button-loading" className="fa-solid fa-spinner fa-spin ml-2"></i>}
          </button>
      </form>

      {/* Unverified Account Banner */}
      {showUnverifiedBanner && (
        <div id="unverified-banner" className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg md:mt-6 md:p-4" aria-live="polite">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-start md:items-center">
              <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-3 mt-0.5 md:mt-0"></i>
              <div>
                <p className="text-sm font-medium text-yellow-800 md:text-sm" id="unverified-banner-title">
                  {unverifiedBannerTitle || 'Tu cuenta no está verificada.'}
                </p>
                <p className="text-sm text-yellow-700 md:text-sm" id="unverified-banner-text">
                  {unverifiedBannerText || 'Revisá tu correo o reenvía el enlace de verificación.'}
                </p>
              </div>
            </div>
            {onResendVerification && (
              <button 
                id="resend-verification-button"
                onClick={onResendVerification}
                className="w-full bg-yellow-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-yellow-700 transition-colors touch-friendly md:w-auto md:ml-4 md:py-1"
                type="button"
              >
                Reenviar verificación
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
