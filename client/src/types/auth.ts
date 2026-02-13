// Authentication Types based on backend API schema

export interface User {
  _id: string;
  fullName: string;
  email: string;
  providers: {
    local?: {
      isActive: boolean;
    };
    google?: {
      id: string;
      isActive: boolean;
    };
  };
  isVerified: boolean;
  verification?: {
    token: string;
    expiresAt: Date;
  };
  passwordReset?: {
    token: string;
    expiresAt: Date;
  };
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastFailedLoginAt?: Date;
  lastLoginAt?: Date;
  twoFactor: {
    isEnabled: boolean;
    secret?: string;
    backupCodes?: string[];
  };
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  providers?: Array<{
    provider: string;
    providerId?: string;
  }>;
  isVerified?: boolean;
  createdAt?: string | Date;
  permissions?: string[];
  twoFactor?: {
    isEnabled?: boolean;
  };
}

export interface ProfileResponse {
  profile?: UserProfile | null;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface TwoFactorFormData {
  code: string;
  challengeId?: string;
}

export interface PasswordRecoveryFormData {
  email: string;
}

export interface PasswordResetFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: UserProfile;
  requiresTwoFactor?: boolean;
  requiresVerification?: boolean;
  challengeId?: string;
  redirectUrl?: string;
}

export interface RegisterResponse {
  type?: 'pending_verification' | 'merged_google' | 'verified' | string;
  message: string;
  profile?: UserProfile;
  user?: User;
  success?: boolean;
}

export interface TwoFactorResponse {
  success: boolean;
  message: string;
  user?: User;
  redirectUrl?: string;
  profile?: UserProfile;
}

export interface GoogleAuthResponse {
  success: boolean;
  message: string;
  user?: User;
  profile?: UserProfile;
  requiresTwoFactor?: boolean;
  challengeId?: string;
  challengeToken?: string;
  challengeExpiresAt?: string;
  redirectUrl?: string;
}

export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface ConfigResponse {
  googleClientId: string | null;
  googleMapsEnabled?: boolean;
  locationIqEnabled?: boolean;
  locationIqTilesKey?: string | null;
  locationIqBaseTilesUrl?: string | null;
  locationIqCountryCodes?: string | null;
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FormErrors {
  [key: string]: string;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar?: boolean;
}

export interface LoadingState {
  login: boolean;
  register: boolean;
  twoFactor: boolean;
  googleAuth: boolean;
  resendVerification: boolean;
  resendTwoFactor: boolean;
  passwordRecovery: boolean;
  passwordReset: boolean;
}

// Additional types for exact HTML replication
export interface RateLimitError {
  message: string;
  retryAfter?: number;
  remainingAttempts?: number;
}

export interface VerificationState {
  isUnverified: boolean;
  canResend: boolean;
  resendCooldown?: number;
}

export interface TwoFactorChallenge {
  challengeId: string;
  canResend: boolean;
  resendCooldown?: number;
}

export interface GoogleConfig {
  clientId: string;
  initialized: boolean;
}

// Form validation states
export interface ValidationState {
  isValid: boolean;
  errors: FormErrors;
  touched: Record<string, boolean>;
}

// Message types for UI feedback
export interface MessageState {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  visible: boolean;
}
