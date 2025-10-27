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
    <div className="p-6">
      {/* Form Title */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-2">Iniciar sesión</h1>
        <p className="text-gray-600 text-sm">Accedé a tu cuenta de FinaTech</p>
      </div>

      {/* Login Form */}
      <form id="login-form" className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div id="email-field">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            Email
          </label>
          <input 
            type="email" 
            id="email" 
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
            placeholder="tu@email.com"
            required
          />
        </div>

        {/* Password Field */}
        <div id="password-field">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"}
              id="password" 
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
              placeholder="Ingresá tu contraseña"
              required
            />
            <button 
              type="button" 
              id="toggle-password"
              onClick={togglePassword}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div id="login-options" className="flex items-center justify-between">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="rememberMe" 
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
              Recordarme
            </label>
          </div>
          <div>
            <Link
              to="/recover"
              onClick={onForgotPasswordClick}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
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

        {/* Login Button */}
        <button 
          type="submit" 
          id="login-button"
          disabled={isLoading}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <span id="login-button-text">{isLoading ? 'Ingresando...' : 'Ingresar'}</span>
          {isLoading && <i id="login-button-loading" className="fa-solid fa-spinner fa-spin ml-2"></i>}
        </button>
      </form>

      {/* Unverified Account Banner */}
      {showUnverifiedBanner && (
        <div id="unverified-banner" className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-3"></i>
              <div>
                <p className="text-sm font-medium text-yellow-800" id="unverified-banner-title">
                  {unverifiedBannerTitle || 'Tu cuenta no está verificada.'}
                </p>
                <p className="text-sm text-yellow-700" id="unverified-banner-text">
                  {unverifiedBannerText || 'Revisá tu correo o reenvía el enlace de verificación.'}
                </p>
              </div>
            </div>
            {onResendVerification && (
              <button 
                id="resend-verification-button"
                onClick={onResendVerification}
                className="ml-4 bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
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
