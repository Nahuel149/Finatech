import { useEffect } from 'react';
import { useApi } from '../useApi';
import { TreasuryLinkedBalancesSummaryResponse } from '../../types';

export const useLinkedTreasuryBalances = () => {
  const api = useApi<TreasuryLinkedBalancesSummaryResponse>('/api/treasury/linked-balances');

  useEffect(() => {
    api.execute().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: api.data?.balances ?? [],
    generatedAt: api.data?.generatedAt ?? null,
    loading: api.loading,
    error: api.error,
    refresh: api.execute,
    reset: api.reset,
  };
};
