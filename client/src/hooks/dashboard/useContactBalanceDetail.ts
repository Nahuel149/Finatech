import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { TreasuryContactBalanceDetailResponse } from '../../types/treasury';
import { subscribeDashboardBalanceRefresh } from '../../utils/balanceEvents';

export interface ContactBalanceDetailFilters {
  currency?: string | null;
  operationType?: string | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  accountKey?: string | null;
  page?: number;
  limit?: number;
  sort?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'type-asc' | 'type-desc';
}

export interface ContactBalanceDetailOptions {
  autoFetch?: boolean;
}

const DEFAULT_RESPONSE: TreasuryContactBalanceDetailResponse = {
  contact: {
    id: '',
    fullName: '',
    shortName: '',
    contactType: 'client',
    status: 'active',
    cuit: null,
    updatedAt: null,
  },
  summary: {
    balance: {
      amount: 0,
      currency: 'ARS',
    },
    variation: null,
    totals: {
      balance: 0,
      incoming: { amount: 0, count: 0 },
      outgoing: { amount: 0, count: 0 },
      net: 0,
      lastMovementAt: null,
    },
    totalsByCurrency: [],
  },
  filters: {
    options: {
      operationTypes: [],
      currencies: [],
      statuses: [],
    },
    applied: {
      currency: null,
      operationType: null,
      status: null,
      dateFrom: null,
      dateTo: null,
      search: null,
    },
  },
  table: {
    items: [],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 1,
    },
    sort: {
      sortBy: 'date',
      sortDirection: 'desc',
    },
  },
  stats: {
    totalsByCurrency: [],
    totalOperations: 0,
  },
};

const buildQueryString = (filters: ContactBalanceDetailFilters) => {
  const params = new URLSearchParams();

  if (filters.currency) {
    params.set('currency', filters.currency);
  }
  if (filters.operationType) {
    params.set('operationType', filters.operationType);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.dateFrom) {
    params.set('dateFrom', filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set('dateTo', filters.dateTo);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.accountKey) {
    params.set('accountKey', filters.accountKey);
  }
  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }
  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  if (filters.sort) {
    const [sortBy, direction] = filters.sort.split('-');
    params.set('sortBy', sortBy);
    params.set('sortDirection', direction);
  }

  return params.toString();
};

export const useContactBalanceDetail = (
  contactId: string | null | undefined,
  filters: ContactBalanceDetailFilters,
  options: ContactBalanceDetailOptions = {}
) => {
  const { autoFetch = true } = options;
  const queryString = useMemo(() => buildQueryString(filters), [filters]);

  const endpoint = useMemo(() => {
    if (!contactId) {
      return null;
    }
    return `/api/treasury/balances/contacts/${contactId}${queryString ? `?${queryString}` : ''}`;
  }, [contactId, queryString]);

  const {
    data,
    loading,
    error,
    execute,
    reset,
  } = useApi<TreasuryContactBalanceDetailResponse>(
    endpoint || '/api/treasury/balances/contacts/__invalid__'
  );

  useEffect(() => {
    if (!autoFetch || !endpoint) {
      return;
    }
    execute().catch(() => {});
  }, [endpoint, autoFetch, execute]);

  useEffect(() => {
    if (!autoFetch || !endpoint) {
      return () => {};
    }
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      execute({ silent: true }).catch(() => {});
    });
    return unsubscribe;
  }, [autoFetch, endpoint, execute]);

  return {
    data: data ?? DEFAULT_RESPONSE,
    loading: contactId ? loading : false,
    error,
    refresh: execute,
    reset,
  };
};
