import { useEffect } from 'react';
import { useApi } from '../useApi';
import { TreasuryBalancesResponse } from '../../types';

export const useTreasuryBalances = () => {
  const api = useApi<TreasuryBalancesResponse>('/api/treasury/balances');

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
