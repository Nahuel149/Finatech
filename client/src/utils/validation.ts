import { PasswordRequirements, FormErrors } from '../types';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password requirements validation
export const validatePasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

// Check if password meets all requirements
export const isPasswordValid = (password: string): boolean => {
  const requirements = validatePasswordRequirements(password);
  return Object.values(requirements).every(Boolean);
};

// Full name validation
export const validateFullName = (fullName: string): boolean => {
  return fullName.trim().length >= 2 && /^[a-zA-ZÀ-ÿ\s]+$/.test(fullName.trim());
};

// Login form validation
export const validateLoginForm = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {};
  
  if (!email.trim()) {
    errors.email = 'El email es requerido';
  } else if (!validateEmail(email)) {
    errors.email = 'Por favor ingresá un email válido';
  }
  
  if (!password) {
    errors.password = 'La contraseña es requerida';
  }
  
  return errors;
};

// Registration form validation
export const validateRegistrationForm = (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
  agreeToTerms: boolean
): FormErrors => {
  const errors: FormErrors = {};
  
  if (!fullName.trim()) {
    errors.fullName = 'El nombre completo es requerido';
  } else if (!validateFullName(fullName)) {
    errors.fullName = 'Por favor ingresá un nombre válido (solo letras y espacios)';
  }
  
  if (!email.trim()) {
    errors.email = 'El email es requerido';
  } else if (!validateEmail(email)) {
    errors.email = 'Por favor ingresá un email válido';
  }
  
  if (!password) {
    errors.password = 'La contraseña es requerida';
  } else if (!isPasswordValid(password)) {
    errors.password = 'La contraseña no cumple con los requisitos';
  }
  
  if (!confirmPassword) {
    errors.confirmPassword = 'Por favor confirmá tu contraseña';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  if (!agreeToTerms) {
    errors.agreeToTerms = 'Debés aceptar los términos y condiciones';
  }
  
  return errors;
};

// Two-factor authentication code validation
export const validateTwoFactorCode = (code: string): FormErrors => {
  const errors: FormErrors = {};
  
  if (!code.trim()) {
    errors.code = 'El código de verificación es requerido';
  } else if (!/^\d{6}$/.test(code.trim())) {
    errors.code = 'Por favor ingresá un código válido de 6 dígitos';
  }
  
  return errors;
};

// Generic form validation helper
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};