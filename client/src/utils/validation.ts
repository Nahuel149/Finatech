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
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password) {
    errors.password = 'Password is required';
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
    errors.fullName = 'Full name is required';
  } else if (!validateFullName(fullName)) {
    errors.fullName = 'Please enter a valid full name (letters and spaces only)';
  }
  
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (!isPasswordValid(password)) {
    errors.password = 'Password does not meet requirements';
  }
  
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  if (!agreeToTerms) {
    errors.agreeToTerms = 'You must accept the terms and conditions';
  }
  
  return errors;
};

// Two-factor authentication code validation
export const validateTwoFactorCode = (code: string): FormErrors => {
  const errors: FormErrors = {};
  
  if (!code.trim()) {
    errors.code = 'Verification code is required';
  } else if (!/^\d{6}$/.test(code.trim())) {
    errors.code = 'Please enter a valid 6-digit code';
  }
  
  return errors;
};

// Generic form validation helper
export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};