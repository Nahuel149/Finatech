import { useEffect, useRef } from 'react';
import { useApi } from '../useApi';
import { DashboardBalancesResponse } from '../../types';

interface UseDashboardBalancesOptions {
  enabled?: boolean;
  pollInterval?: number;
}

export const useDashboardBalances = (options: UseDashboardBalancesOptions = {}) => {
  const { enabled = true, pollInterval = 0 } = options;
  const { data, loading, error, execute } = useApi<DashboardBalancesResponse>('/api/dashboard/balances');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const controller = new AbortController();
    execute({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [enabled, execute]);

  useEffect(() => {
    if (!enabled || !pollInterval) {
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      execute().catch(() => {});
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, execute]);

  return {
    balances: data?.balances ?? [],
    loading,
    error,
    refresh: execute,
  };
};
