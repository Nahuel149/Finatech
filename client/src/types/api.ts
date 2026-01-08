// General API Types

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  signal?: AbortSignal | null;
  // UseApi-only hint to avoid toggling loading state on background refreshes.
  silent?: boolean;
}

export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (config?: Partial<RequestConfig>) => Promise<T>;
  reset: () => void;
}
