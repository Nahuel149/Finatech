import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, TreasuryMovement, TreasuryMovementsResponse } from '../../types';
import { useApi } from '../useApi';

export type TreasuryMovementsSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'status';

export interface TreasuryMovementsFilters {
  dateFrom: string;
  dateTo: string;
  type: string;
  medium: string;
  currency: string;
  status: string;
  contactId: string;
  search: string;
}

export interface UseTreasuryMovementsOptions {
  limit?: number;
  autoRefreshMs?: number;
  initialFilters?: Partial<TreasuryMovementsFilters>;
}

const DEFAULT_FILTERS: TreasuryMovementsFilters = {
  dateFrom: '',
  dateTo: '',
  type: '',
  medium: '',
  currency: '',
  status: '',
  contactId: '',
  search: '',
};

const sortToParams = (sort: TreasuryMovementsSortOption) => {
  switch (sort) {
    case 'date-asc':
      return { sortBy: 'movementAt', sortDirection: 'asc' as const };
    case 'amount-desc':
      return { sortBy: 'amount', sortDirection: 'desc' as const };
    case 'amount-asc':
      return { sortBy: 'amount', sortDirection: 'asc' as const };
    case 'status':
      return { sortBy: 'movementAt', sortDirection: 'desc' as const };
    case 'date-desc':
    default:
      return { sortBy: 'movementAt', sortDirection: 'desc' as const };
  }
};

const normalizeFiltersForQuery = (filters: TreasuryMovementsFilters) => {
  const params = new URLSearchParams();

  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.type) params.set('type', filters.type.toLowerCase());
  if (filters.medium) params.set('medium', filters.medium.toLowerCase());
  if (filters.currency) params.set('currency', filters.currency.toUpperCase());
  if (filters.status) params.set('status', filters.status.toLowerCase());
  if (filters.contactId) params.set('contact', filters.contactId);
  if (filters.search) params.set('search', filters.search.trim());

  return params;
};

const sortItemsLocally = (
  items: TreasuryMovement[],
  sort: TreasuryMovementsSortOption
): TreasuryMovement[] => {
  if (sort !== 'status') {
    return items;
  }

  const priority = ['compensated', 'registered', 'cancelled'];
  return [...items].sort((a, b) => {
    const aIndex = priority.indexOf(String(a.status).toLowerCase());
    const bIndex = priority.indexOf(String(b.status).toLowerCase());
    if (aIndex === bIndex) {
      const aDate = a.movementAt ? new Date(a.movementAt).getTime() : 0;
      const bDate = b.movementAt ? new Date(b.movementAt).getTime() : 0;
      return bDate - aDate;
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

export const useTreasuryMovements = (options: UseTreasuryMovementsOptions = {}) => {
  const { limit = 20, autoRefreshMs = 60000, initialFilters = {} } = options;
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<TreasuryMovementsSortOption>('date-desc');
  const [filters, setFilters] = useState<TreasuryMovementsFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const params = useMemo(() => {
    const urlParams = normalizeFiltersForQuery(filters);
    const { sortBy, sortDirection } = sortToParams(sort);
    urlParams.set('page', String(page));
    urlParams.set('limit', String(limit));
    urlParams.set('sortBy', sortBy);
    urlParams.set('sortDirection', sortDirection);
    return urlParams;
  }, [filters, limit, page, sort]);

  const endpoint = useMemo(
    () => `/api/treasury/movements?${params.toString()}`,
    [params]
  );

  const { data, loading, error, execute } = useApi<TreasuryMovementsResponse>(endpoint);
  // Trigger API call whenever the endpoint (filters, pagination, sort) changes
  useEffect(() => {
    execute().catch(() => {});
  }, [endpoint, execute]);
  const [items, setItems] = useState<TreasuryMovement[]>([]);

  // The previous effect that depended only on `execute` is no longer necessary and
  // has been merged into the effect above to ensure fresh data is fetched when
  // any parameter affecting the `endpoint` changes.
  useEffect(() => {
    if (!data) return;
    const itemsWithSort = sortItemsLocally(data.items ?? [], sort);
    setItems(itemsWithSort);
  }, [data, sort]);

  const refresh = useCallback(() => {
    execute().catch(() => {});
  }, [execute]);

  useEffect(() => {
    if (autoRefreshMs <= 0) return;
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    autoRefreshRef.current = setInterval(() => {
      refresh();
    }, autoRefreshMs);

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [autoRefreshMs, refresh]);

  const applyFilters = useCallback((next: Partial<TreasuryMovementsFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...next,
    }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const updateSort = useCallback((nextSort: TreasuryMovementsSortOption) => {
    setSort(nextSort);
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  return {
    items,
    pagination: data?.pagination ?? {
      page: 1,
      limit,
      totalItems: 0,
      totalPages: 1,
    },
    totals: data?.totals ?? {},
    loading,
    error: error as ApiError | null,
    filters,
    applyFilters,
    clearFilters,
    refresh,
    sort,
    updateSort,
    page,
    goToPage,
    limit,
  };
};
