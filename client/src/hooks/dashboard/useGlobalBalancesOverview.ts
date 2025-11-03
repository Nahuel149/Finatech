import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import {
  TreasuryGlobalBalancesOverviewResponse,
  TreasuryBalanceState,
} from '../../types';
import { subscribeDashboardBalanceRefresh } from '../../utils';

export interface GlobalBalancesFilters {
  currency?: string;
  accountKey?: string;
  contactType?: string;
  balanceState?: TreasuryBalanceState | '';
  search?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number;
  limit?: number;
  sortBy?: 'balance' | 'name' | 'variation' | 'lastMovement';
  sortDirection?: 'asc' | 'desc';
}

const buildQueryString = (filters: GlobalBalancesFilters) => {
  const params = new URLSearchParams();

  if (filters.currency && filters.currency !== 'ALL') {
    params.set('currency', filters.currency);
  }

  if (filters.accountKey) {
    params.set('accountKey', filters.accountKey);
  }

  if (filters.contactType) {
    params.set('contactType', filters.contactType);
  }

  if (filters.balanceState) {
    params.set('balanceState', filters.balanceState);
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.dateFrom) {
    params.set('dateFrom', filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set('dateTo', filters.dateTo);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  if (filters.sortBy) {
    params.set('sortBy', filters.sortBy);
  }

  if (filters.sortDirection) {
    params.set('sortDirection', filters.sortDirection);
  }

  return params.toString();
};

const EMPTY_OVERVIEW: TreasuryGlobalBalancesOverviewResponse = {
  generatedAt: new Date().toISOString(),
  summaryCards: [],
  filters: {
    currencies: [],
    accountKeys: [],
    balanceStates: [],
    contactTypes: [],
  },
  table: {
    items: [],
    pagination: {
      page: 1,
      limit: 15,
      totalItems: 0,
      totalPages: 1,
    },
  },
  stats: {
    totalBalance: 0,
    balanceStates: {
      positive: 0,
      negative: 0,
      zero: 0,
    },
    totalsByCurrency: [],
  },
  appliedFilters: {
    currency: null,
    accountKey: null,
    contactType: null,
    balanceState: null,
    search: null,
    dateFrom: null,
    dateTo: null,
  },
};

export const useGlobalBalancesOverview = (filters: GlobalBalancesFilters) => {
  const queryString = useMemo(() => buildQueryString(filters), [filters]);
  const endpoint = useMemo(
    () => `/api/treasury/balances/overview${queryString ? `?${queryString}` : ''}`,
    [queryString]
  );
  const { data, loading, error, execute, reset } = useApi<TreasuryGlobalBalancesOverviewResponse>(
    endpoint
  );

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
    data: data ?? EMPTY_OVERVIEW,
    loading,
    error,
    refresh: execute,
    reset,
  };
};
