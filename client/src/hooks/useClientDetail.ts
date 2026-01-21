import { useEffect } from 'react';
import { useApi } from './useApi';
import { ApiError } from '../types/auth';
import { ClientSummary } from '../types/client';

export const useClientDetail = (clientId?: string | null) => {
  const endpoint = clientId ? `/api/clients/${clientId}` : '';
  const { data, loading, error, execute, reset } = useApi<ClientSummary>(endpoint, {
    immediate: false,
  });

  useEffect(() => {
    if (!clientId) {
      reset();
      return;
    }
    execute().catch(() => {});
  }, [clientId, execute, reset]);

  return {
    client: data ?? null,
    loading,
    error: (error as ApiError) || null,
    refresh: execute,
  };
};
