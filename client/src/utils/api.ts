import {
  ApiError,
  LogisticsDiscrepancyPayload,
  LogisticsItemsHandoverPayload,
  LogisticsOperationUpdatePayload,
  LogisticsOrderPayload,
  LogisticsPartialCompletionPayload,
  RequestConfig,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const CSRF_COOKIE_NAME = 'finatech_csrf';

export const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    return path;
  }

  const trimmedBase = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  if (path.startsWith('/')) {
    return `${trimmedBase}${path}`;
  }

  return `${trimmedBase}/${path}`;
};

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
    if (name === CSRF_COOKIE_NAME || name === 'csrfToken') {
      return decodeURIComponent(value);
    }
  }
  
  return null;
};

let csrfTokenCache: string | null = null;
let csrfFetchPromise: Promise<void> | null = null;

const hasCsrfTokenAvailable = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  const cookieToken = getCSRFToken();
  if (cookieToken) {
    csrfTokenCache = cookieToken;
    return true;
  }

  // If the cookie expired we should not trust any cached value anymore
  csrfTokenCache = null;
  return false;
};

const requestCsrfToken = async () => {
  try {
    const response = await fetch(buildApiUrl('/api/csrf-token'), {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response
      .json()
      .catch(() => null);

    if (data?.csrfToken) {
      csrfTokenCache = data.csrfToken;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('No se pudo obtener la cookie CSRF:', error);
  }
};

export const ensureCsrfCookie = async ({ force = false }: { force?: boolean } = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!force && hasCsrfTokenAvailable()) {
    return;
  }

  if (!csrfFetchPromise) {
    csrfFetchPromise = requestCsrfToken().finally(() => {
      csrfFetchPromise = null;
    });
  }

  await csrfFetchPromise;
};

export const forceRefreshCsrfCookie = async () => {
  csrfTokenCache = null;
  await ensureCsrfCookie({ force: true });
};

// Allow callers to proactively fetch the CSRF cookie on app start
export const prefetchCsrfToken = async () => {
  try {
    await ensureCsrfCookie();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('No se pudo prefetchear la cookie CSRF:', error);
  }
};

// Default headers for API requests
const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const cookieToken = getCSRFToken();
  if (cookieToken) {
    csrfTokenCache = cookieToken;
  }

  const csrfToken = cookieToken || csrfTokenCache;
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

const isCsrfErrorResponse = (status: number, payload: any) => {
  if (status !== 403 || !payload) {
    return false;
  }

  const source = typeof payload === 'string' ? payload : payload.message || payload.error || payload.code;
  if (!source) {
    return false;
  }

  return String(source).toLowerCase().includes('csrf');
};

// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  config: Partial<RequestConfig> = {}
): Promise<T> => {
  if (typeof window !== 'undefined') {
    await ensureCsrfCookie();
  }

  const url = buildApiUrl(endpoint);
  const method = config.method || 'GET';
  const credentials = config.credentials || 'include';
  const isFormData = typeof FormData !== 'undefined' && config.body instanceof FormData;
  let preparedBody: BodyInit | null | undefined;

  if (config.body && method !== 'GET') {
    if (isFormData) {
      preparedBody = config.body as FormData;
    } else if (typeof config.body === 'string') {
      preparedBody = config.body;
    } else {
      preparedBody = JSON.stringify(config.body);
    }
  }

  const executeRequest = async (retry = false): Promise<T> => {
    const headers: Record<string, string> = {
      ...getDefaultHeaders(),
      ...(config.headers || {}),
    };

    if (isFormData && headers['Content-Type']) {
      delete headers['Content-Type'];
    }

    const requestConfig: RequestInit = {
      method,
      headers,
      credentials,
      body: preparedBody,
    };

    if (config.signal) {
      requestConfig.signal = config.signal;
    }

    const response = await fetch(url, requestConfig);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (!retry && isCsrfErrorResponse(response.status, data)) {
        await forceRefreshCsrfCookie();
        return executeRequest(true);
      }

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
  };

  try {
    return await executeRequest();
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

  keepAlive: (config: Partial<RequestConfig> = {}) =>
    apiRequest('/api/auth/keep-alive', {
      method: 'GET',
      ...config,
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
  geocodeAddress: (query: string) =>
    apiRequest('/api/location/geocode' + buildQueryString({ query })),
    
  // User profile
  getProfile: () =>
    apiRequest('/api/auth/me'),
  // Admin
  getAdminPermissions: () =>
    apiRequest('/api/admin/permissions'),
  getAdminUsers: () =>
    apiRequest('/api/admin/users'),
  updateUserPermissions: (userId: string, permissions: string[]) =>
    apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/permissions`, {
      method: 'PUT',
      body: { permissions },
    }),

  // Logistics
  getLogisticsOperations: (params?: Record<string, unknown>) =>
    apiRequest(`/api/logistics/operations${buildQueryString(params)}`),
  getLogisticsOperationById: (operationId: string) =>
    apiRequest(`/api/logistics/operations/${encodeURIComponent(operationId)}`),
  updateLogisticsOperation: (
    operationId: string,
    payload: LogisticsOperationUpdatePayload
  ) =>
    apiRequest(`/api/logistics/operations/${encodeURIComponent(operationId)}`, {
      method: 'PATCH',
      body: payload,
    }),
  updateLogisticsOperationState: (operationId: string, payload: { state: string }) =>
    apiRequest(`/api/logistics/operations/${encodeURIComponent(operationId)}/state`, {
      method: 'PATCH',
      body: payload,
    }),
  archiveLogisticsOperations: (operationIds: string[]) =>
    apiRequest('/api/logistics/operations/archive', {
      method: 'POST',
      body: { ids: operationIds },
    }),
  restoreLogisticsOperations: (operationIds: string[]) =>
    apiRequest('/api/logistics/operations/unarchive', {
      method: 'POST',
      body: { ids: operationIds },
    }),
  getLogisticsIncidents: (params?: Record<string, unknown>) =>
    apiRequest(`/api/logistics/incidents${buildQueryString(params)}`),
  getLogisticsIncident: (incidentId: string) =>
    apiRequest(`/api/logistics/incidents/${encodeURIComponent(incidentId)}`),
  updateLogisticsIncidentStatus: (incidentId: string, payload: { status: string }) =>
    apiRequest(`/api/logistics/incidents/${encodeURIComponent(incidentId)}/status`, {
      method: 'PATCH',
      body: payload,
    }),

  getOperationLogisticsOrders: (operationId: string) =>
    apiRequest(`/api/operations/${encodeURIComponent(operationId)}/logistics-orders`),

  createLogisticsOrder: (operationId: string, payload: LogisticsOrderPayload) =>
    apiRequest(`/api/operations/${encodeURIComponent(operationId)}/logistics-orders`, {
      method: 'POST',
      body: payload,
    }),

  updateLogisticsOrder: (orderId: string, payload: LogisticsOrderPayload) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      body: payload,
    }),

  getLogisticsOrder: (orderId: string) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}`),

  getMyLogisticsOrders: (params?: Record<string, unknown>) =>
    apiRequest(`/api/logistics/my-orders${buildQueryString(params)}`),

  startLogisticsRoute: (orderId: string) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/start-route`, {
      method: 'PATCH',
    }),

  arriveAtLogisticsOrder: (orderId: string, payload: { gpsLat?: number; gpsLng?: number }) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/arrive`, {
      method: 'PATCH',
      body: payload,
    }),

  updateLogisticsOrderItems: (orderId: string, payload: LogisticsItemsHandoverPayload) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/items`, {
      method: 'PATCH',
      body: payload,
    }),

  uploadLogisticsEvidence: (orderId: string, formData: FormData) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/evidences`, {
      method: 'POST',
      body: formData,
    }),

  completeLogisticsOrderTotal: (orderId: string) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/complete-total`, {
      method: 'PATCH',
    }),

  completeLogisticsOrderPartial: (orderId: string, payload: LogisticsPartialCompletionPayload) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/complete-partial`, {
      method: 'PATCH',
      body: payload,
    }),

  reportLogisticsDiscrepancy: (orderId: string, payload: LogisticsDiscrepancyPayload) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/discrepancy`, {
      method: 'PATCH',
      body: payload,
    }),

  getLogisticsOrderTimeline: (orderId: string) =>
    apiRequest(`/api/logistics-orders/${encodeURIComponent(orderId)}/timeline`),
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
