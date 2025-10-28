import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useConfig } from '../hooks';
import { RegisterResponse } from '../types';
import { validateRegistrationForm, hasFormErrors } from '../utils/validation';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showExistingEmailMessage, setShowExistingEmailMessage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState<RegisterResponse | null>(null);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const { register, googleAuth, resendVerification } = useAuth();
  const { config } = useConfig();

  const handleGoogleResponse = useCallback(async (response: any) => {
    if (response.credential) {
      setIsGoogleLoading(true);
      try {
        await googleAuth(response.credential, false);
        setShowSuccessMessage(true);
      } catch (error: any) {
        setFormErrors({ general: error.message || 'Error con Google Sign-In' });
      } finally {
        setIsGoogleLoading(false);
      }
    }
  }, [googleAuth]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hide all messages
    setShowSuccessMessage(false);
    setShowExistingEmailMessage(false);
    
    // Validate form
    const errors = validateRegistrationForm(
      formData.fullName,
      formData.email,
      formData.password,
      formData.confirmPassword,
      formData.agreeToTerms
    );
    if (hasFormErrors(errors)) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    setRegisterResult(null);
    setResendState('idle');
    setResendMessage('');
    
    try {
      const response = await register(formData);
      setRegisterResult(response);
      setLastSubmittedEmail(formData.email.trim().toLowerCase());

      if (response && response.type === 'merged_google') {
        navigate('/dashboard');
        return;
      }

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
      });
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('already registered')) {
        setShowExistingEmailMessage(true);
      } else {
        setFormErrors({ general: error.message || 'Error al registrar usuario' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (!config?.googleClientId) {
      setFormErrors({ general: 'Google Sign-In no está configurado. Contactá al administrador.' });
      return;
    }

    setIsGoogleLoading(true);
    setFormErrors({});

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

        window.google.accounts.id.prompt((notification) => {
          if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
            setFormErrors({ general: 'Se canceló el diálogo de Google. Intentá de nuevo.' });
          }
          setIsGoogleLoading(false);
        });
      } catch (error) {
        console.error('Error showing Google Sign-In prompt:', error);
        setFormErrors({ general: 'Error al cargar Google Sign-In. Intentá de nuevo.' });
        setIsGoogleLoading(false);
      }
    } else {
      setFormErrors({ general: 'Google Sign-In no está disponible. Verificá tu conexión e intentá de nuevo.' });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <div className="flex-1" aria-hidden="true" />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2">
                <i className="fa-solid fa-chart-line text-white text-xs"></i>
              </div>
              <span className="text-lg font-bold text-text-primary">FinaTech</span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary hover:underline font-medium text-sm"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Registration Form */}
      <main className="px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full">
            <div className="p-6">
              {/* Form Title */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-text-primary mb-2">Crear cuenta</h1>
                <p className="text-gray-600 text-sm">Completá los datos para registrarte en FinaTech</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                    Nombre completo
                  </label>
                  <input 
                    type="text" 
                    id="fullName" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                    placeholder="Ingresá tu nombre completo"
                    required
                  />
                  {formErrors.fullName && (
                    <div className="mt-1 text-sm text-danger">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i>
                      {formErrors.fullName}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
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
                  {formErrors.email && (
                    <div className="mt-1 text-sm text-danger">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i>
                      {formErrors.email}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div>
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
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-1">
                    <div className="text-xs text-gray-600 mb-2">La contraseña debe contener:</div>
                    <div className={`flex items-center text-xs ${formData.password.length >= 8 ? 'text-success' : 'text-gray-500'}`}>
                      <i className={`fa-solid ${formData.password.length >= 8 ? 'fa-check' : 'fa-circle'} text-xs mr-2`}></i>
                      Mínimo 8 caracteres
                    </div>
                    <div className={`flex items-center text-xs ${/[A-Z]/.test(formData.password) ? 'text-success' : 'text-gray-500'}`}>
                      <i className={`fa-solid ${/[A-Z]/.test(formData.password) ? 'fa-check' : 'fa-circle'} text-xs mr-2`}></i>
                      Al menos una mayúscula
                    </div>
                    <div className={`flex items-center text-xs ${/[a-z]/.test(formData.password) ? 'text-success' : 'text-gray-500'}`}>
                      <i className={`fa-solid ${/[a-z]/.test(formData.password) ? 'fa-check' : 'fa-circle'} text-xs mr-2`}></i>
                      Al menos una minúscula
                    </div>
                    <div className={`flex items-center text-xs ${/\d/.test(formData.password) ? 'text-success' : 'text-gray-500'}`}>
                      <i className={`fa-solid ${/\d/.test(formData.password) ? 'fa-check' : 'fa-circle'} text-xs mr-2`}></i>
                      Al menos un número
                    </div>
                  </div>
                  
                  {formErrors.password && (
                    <div className="mt-1 text-sm text-danger">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i>
                      {formErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                      placeholder="Repetí tu contraseña"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <div className="mt-1 text-sm text-danger">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i>
                      {formErrors.confirmPassword}
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="agreeToTerms" 
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-600">
                      Acepto los{' '}
                      <a className="text-primary hover:underline" href="/terms" target="_blank" rel="noopener noreferrer">términos</a>{' '}
                      y{' '}
                      <a className="text-primary hover:underline" href="/terms" target="_blank" rel="noopener noreferrer">condiciones</a>{' '}
                      de uso de la plataforma
                    </label>
                  </div>
                  {formErrors.agreeToTerms && (
                    <div className="mt-1 text-sm text-danger">
                      <i className="fa-solid fa-exclamation-circle mr-1"></i>
                      {formErrors.agreeToTerms}
                    </div>
                  )}
                </div>

                {/* General Error */}
                {formErrors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-exclamation-circle text-danger mr-2"></i>
                      <span className="text-sm text-red-700">{formErrors.general}</span>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-check-circle text-success mr-2"></i>
                      <span className="text-sm text-green-700">¡Registro exitoso con Google! Serás redirigido al panel principal.</span>
                    </div>
                  </div>
                )}

                {/* Register Button */}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <span>{isLoading ? 'Registrando...' : 'Registrarme'}</span>
                  {isLoading && <i className="fa-solid fa-spinner fa-spin ml-2"></i>}
                </button>
              </form>

              {/* Separator */}
              <div className="my-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o</span>
                  </div>
                </div>
              </div>

              {/* Google Register Button */}
              <button 
                type="button" 
                onClick={handleGoogleClick}
                disabled={isGoogleLoading}
                className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center text-sm disabled:opacity-50"
                aria-label="Registrarse con Google"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{isGoogleLoading ? 'Cargando...' : 'Continuar con Google'}</span>
              </button>

              {/* Success / Verification Message */}
              {registerResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <i className="fa-solid fa-check-circle text-success mr-3 mt-1"></i>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        {registerResult.type === 'pending_verification' ? '¡Registro exitoso!' : 'Cuenta vinculada'}
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        {registerResult.message || 'Revisá tu correo para conocer los próximos pasos.'}
                      </p>
                      {registerResult.type === 'pending_verification' && lastSubmittedEmail && (
                        <div className="mt-3">
                          <p className="text-xs text-green-700 mb-2">
                            Si no recibiste el correo de verificación, podés reenviarlo.
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!lastSubmittedEmail) {
                                return;
                              }
                              setResendState('loading');
                              setResendMessage('');
                              try {
                                await resendVerification(lastSubmittedEmail);
                                setResendState('success');
                                setResendMessage('Enviamos un nuevo correo de verificación. Revisá tu bandeja de entrada.');
                              } catch (error: any) {
                                setResendState('error');
                                setResendMessage(error?.message || 'No pudimos reenviar el correo. Intentá nuevamente.');
                              }
                            }}
                            className="inline-flex items-center px-3 py-2 bg-white border border-green-300 text-green-700 rounded-md text-xs font-medium hover:bg-green-50 disabled:opacity-60"
                            disabled={resendState === 'loading'}
                          >
                            {resendState === 'loading' && <i className="fa-solid fa-spinner fa-spin mr-2"></i>}
                            Reenviar correo de verificación
                          </button>
                          {resendState !== 'idle' && resendMessage && (
                            <p className={`text-xs mt-2 ${resendState === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                              {resendMessage}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Email Message */}
              {showExistingEmailMessage && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="fa-solid fa-info-circle text-yellow-600 mr-3"></i>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Email ya registrado</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        El email ya está registrado. 
                        <button 
                          onClick={() => navigate('/login')}
                          className="underline hover:no-underline cursor-pointer ml-1"
                        >
                          Iniciá sesión
                        </button> 
                        o 
                        <button 
                          onClick={() => navigate('/recover')}
                          className="underline hover:no-underline cursor-pointer ml-1"
                        >
                          recuperá tu contraseña
                        </button>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Login Link */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tenés cuenta? 
                <button 
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline font-medium ml-1"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
