import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { DashboardRecentOperationsResponse } from '../../types';
import { subscribeDashboardBalanceRefresh } from '../../utils';

interface UseDashboardOperationsOptions {
  limit?: number;
}

export const useDashboardOperations = (options: UseDashboardOperationsOptions = {}) => {
  const { limit = 10 } = options;
  const sanitizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const endpoint = useMemo(
    () => `/api/dashboard/operations/recent?limit=${encodeURIComponent(sanitizedLimit)}`,
    [sanitizedLimit]
  );

  const { data, loading, error, execute } = useApi<DashboardRecentOperationsResponse>(endpoint, {});

  useEffect(() => {
    execute().catch(() => {});
  }, [endpoint, execute]);

  useEffect(() => {
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      execute().catch(() => {});
    });
    return unsubscribe;
  }, [execute]);

  return {
    items: data?.items ?? [],
    loading,
    error,
    refresh: execute,
  };
};
