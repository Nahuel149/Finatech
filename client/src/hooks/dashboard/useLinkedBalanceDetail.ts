import { useCallback, useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { TreasuryLinkedBalanceDetailResponse } from '../../types/treasury';

export interface LinkedBalanceDetailParams {
  dateFrom?: string | null;
  dateTo?: string | null;
  type?: string | null;
  contactId?: string | null;
  page?: number;
  limit?: number;
}

export interface UseLinkedBalanceDetailOptions {
  autoFetch?: boolean;
}

export const useLinkedBalanceDetail = (
  balanceId: string | null,
  params: LinkedBalanceDetailParams = {},
  options: UseLinkedBalanceDetailOptions = {}
) => {
  const autoFetch = options.autoFetch ?? true;

  const queryString = useMemo(() => {
    const searchParams = new URLSearchParams();
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params.type) searchParams.set('type', params.type);
    if (params.contactId) searchParams.set('contactId', params.contactId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return searchParams.toString();
  }, [params.contactId, params.dateFrom, params.dateTo, params.limit, params.page, params.type]);

  const endpoint = useMemo(() => {
    if (!balanceId) {
      return '/api/treasury/linked-balances';
    }
    return `/api/treasury/linked-balances/${balanceId}${queryString ? `?${queryString}` : ''}`;
  }, [balanceId, queryString]);

  const api = useApi<TreasuryLinkedBalanceDetailResponse>(endpoint);

  const fetch = useCallback(async () => {
    if (!balanceId) {
      return null;
    }
    return api.execute();
  }, [api, balanceId]);

  useEffect(() => {
    if (!balanceId) {
      return;
    }
    if (!autoFetch) {
      return;
    }
    fetch().catch(() => {});
  }, [autoFetch, balanceId, fetch]);

  return {
    detail: api.data,
    loading: api.loading,
    error: api.error,
    refresh: fetch,
    reset: api.reset,
  };
};
