import { useEffect } from 'react';
import { useApi } from '../useApi';
import { DashboardBalancesResponse } from '../../types';

export const useDashboardBalances = () => {
  const api = useApi<DashboardBalancesResponse>('/api/dashboard/balances');

  useEffect(() => {
    api.execute().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    balances: api.data?.balances ?? [],
    loading: api.loading,
    error: api.error,
    refresh: api.execute,
  };
};