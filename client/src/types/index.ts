// Export all types
export * from './auth';
export type {
  ApiResponse,
  PaginatedResponse,
  RequestConfig,
  UseApiOptions,
  UseApiState
} from './api';
export * from './dashboard';
export * from './transfer';
export * from './client';
export * from './transaction';

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface TwoFactorFormData {
  code: string;
  challengeId: string;
}

// Message and State Types
export interface MessageState {
  type: 'error' | 'success' | 'warning';
  message: string;
  visible: boolean;
}

export interface VerificationState {
  isUnverified: boolean;
  canResend: boolean;
}

export interface RateLimitError {
  message: string;
  retryAfter?: number;
}
