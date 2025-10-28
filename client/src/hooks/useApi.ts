import { useState, useCallback, useRef } from 'react';
import { UseApiState, UseApiOptions, RequestConfig, ApiError } from '../types';
import { apiRequest, handleApiError } from '../utils';

export const useApi = <T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  // Use ref to store options to avoid recreating execute function on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  // Store endpoint in ref to make execute function stable
  const endpointRef = useRef(endpoint);
  endpointRef.current = endpoint;

  const execute = useCallback(async (config: Partial<RequestConfig> = {}): Promise<T> => {
    console.log(`[useApi] Execute called for endpoint: ${endpointRef.current} at ${new Date().toISOString()}`);
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<T>(endpointRef.current, config);
      setData(response);
      
      if (optionsRef.current.onSuccess) {
        optionsRef.current.onSuccess(response);
      }
      
      return response;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      
      if (optionsRef.current.onError) {
        optionsRef.current.onError(apiError);
      }
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - function is completely stable
  
  console.log(`[useApi] Hook called for endpoint: ${endpoint}, execute function created:`, execute.toString().slice(0, 50) + '...');

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