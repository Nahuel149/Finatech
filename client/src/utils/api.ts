import { ApiError, RequestConfig } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Get CSRF token from meta tag or cookie
const getCSRFToken = (): string | null => {
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
  if (metaTag) {
    return metaTag.content;
  }
  
  // Fallback to cookies: prefer 'finatech_csrf', then 'csrfToken'
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'finatech_csrf' || name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  
  return null;
};

const CSRF_COOKIE_NAME = 'finatech_csrf';
let csrfEnsured = false;

const hasCsrfCookie = () => {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie.split(';').some((cookie) => cookie.trim().startsWith(`${CSRF_COOKIE_NAME}=`));
};

const getConfigEndpoint = () => {
  if (!API_BASE_URL) {
    return '/api/config';
  }

  const trimmedBase = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  return `${trimmedBase}/api/config`;
};

const ensureCsrfCookie = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (hasCsrfCookie()) {
    csrfEnsured = true;
    return;
  }

  if (csrfEnsured) {
    return;
  }

  csrfEnsured = true;
  try {
    await fetch(getConfigEndpoint(), {
      method: 'GET',
      credentials: 'include',
    });

    if (!hasCsrfCookie()) {
      csrfEnsured = false;
      // eslint-disable-next-line no-console
      console.warn('No CSRF cookie present after ensure request');
    }
  } catch (error) {
    csrfEnsured = false;
    // eslint-disable-next-line no-console
    console.warn('No se pudo obtener la cookie CSRF:', error);
  }
};

// Default headers for API requests
const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
};

const buildQueryString = (params?: Record<string, unknown>) => {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== '') {
          searchParams.append(key, String(entry));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const createApiError = (payload: ApiError & { status?: number; details?: any }) => {
  const error = new Error(payload.message) as Error & ApiError & {
    status?: number;
    details?: any;
  };
  error.code = payload.code;
  if (payload.status !== undefined) {
    error.status = payload.status;
  }
  if (payload.details !== undefined) {
    error.details = payload.details;
  }
  if (payload.field !== undefined) {
    error.field = payload.field;
  }
  return error;
};

// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: Partial<RequestConfig> = {}
): Promise<T> => {
  if (typeof window !== 'undefined') {
    await ensureCsrfCookie();
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const requestConfig: RequestInit = {
    method: config.method || 'GET',
    headers: {
      ...getDefaultHeaders(),
      ...config.headers,
    },
    credentials: config.credentials || 'include',
  };
  
  if (config.body && (requestConfig.method || 'GET') !== 'GET') {
    requestConfig.body = JSON.stringify(config.body);
  }

  if (config.signal) {
    requestConfig.signal = config.signal;
  }
  
  try {
    const response = await fetch(url, requestConfig);
    
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorPayload = {
        message:
          (data && (data.message || data.error)) ||
          `HTTP ${response.status}: ${response.statusText}`,
        code: data?.code,
        details: data?.details,
        status: response.status,
        field: Array.isArray(data?.errors) ? data.errors[0]?.field : undefined,
      };
      throw createApiError(errorPayload);
    }
    
    return (data ?? ({} as T)) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw createApiError({ message: 'Network error occurred', code: 'NETWORK_ERROR' });
  }
};

// Specific API methods
export const api = {
  // Authentication endpoints
  login: (email: string, password: string, rememberMe: boolean = false) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password, rememberMe },
    }),
    
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: payload,
    }),
    
  googleAuth: (credential: string, isLogin: boolean = true) =>
    apiRequest(`/api/auth/google${isLogin ? '' : '?register=true'}`, {
      method: 'POST',
      body: { credential },
    }),
    
  twoFactorAuth: (challengeId: string, code: string) =>
    apiRequest('/api/auth/login/2fa', {
      method: 'POST',
      body: { challengeId, code },
    }),
    
  resendTwoFactor: (challengeId: string) =>
    apiRequest('/api/auth/login/2fa/resend', {
      method: 'POST',
      body: { challengeId },
    }),
    
  resendVerification: (email: string) =>
    apiRequest('/api/auth/resend-verification', {
      method: 'POST',
      body: { email },
    }),

  markNotificationRead: (notificationId: string) =>
    apiRequest(`/api/dashboard/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    apiRequest('/api/dashboard/notifications/read-all', {
      method: 'POST',
    }),

  createNotification: (payload: {
    title: string;
    message: string;
    severity?: 'info' | 'success' | 'warning' | 'error';
    actionLabel?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown> | null;
  }) =>
    apiRequest('/api/dashboard/notifications', {
      method: 'POST',
      body: payload,
    }),

  updateNotification: (
    id: string,
    payload: Partial<{
      title: string;
      message: string;
      severity: 'info' | 'success' | 'warning' | 'error';
      actionLabel?: string;
      actionUrl?: string;
      metadata?: Record<string, unknown> | null;
    }>
  ) =>
    apiRequest(`/api/dashboard/notifications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: payload,
    }),

  deleteNotification: (id: string) =>
    apiRequest(`/api/dashboard/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
    
  logout: () =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
    }),

  // Password recovery endpoints
  requestPasswordReset: (email: string) =>
    apiRequest('/api/auth/recover', {
      method: 'POST',
      body: { email },
    }),

  validateResetToken: (token: string) =>
    apiRequest('/api/auth/reset/validate', {
      method: 'POST',
      body: { token },
    }),

  resetPassword: (token: string, password: string) =>
    apiRequest('/api/auth/reset', {
      method: 'POST',
      body: { token, password },
    }),
    
  // Configuration
  getConfig: () =>
    apiRequest('/api/config'),
    
  // User profile
  getProfile: () =>
    apiRequest('/api/auth/me'),

  // Logistics
  getLogisticsOperations: (params?: Record<string, unknown>) =>
    apiRequest(`/api/logistics/operations${buildQueryString(params)}`),
};

// Error handling utility
export const handleApiError = (error: any): ApiError => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error as ApiError;
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
};
