import { useState, useCallback } from 'react';
import { UseApiState, UseApiOptions, RequestConfig, ApiError } from '../types';
import { apiRequest, handleApiError } from '../utils';

export const useApi = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (config: Partial<RequestConfig> = {}): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<T>(endpoint, config);
      setData(response);
      
      if (options.onSuccess) {
        options.onSuccess(response);
      }
      
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      
      if (options.onError) {
        options.onError(apiError);
      }
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};