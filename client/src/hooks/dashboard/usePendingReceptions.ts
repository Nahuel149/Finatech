import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  TreasuryReception,
  TreasuryReceptionStatus,
  TreasuryReceptionsResponse,
} from '../../types';
import { handleApiError, getPendingTreasuryReceptions } from '../../utils';

export interface PendingReceptionFilters {
  status: '' | TreasuryReceptionStatus;
  dateFrom: string;
  dateTo: string;
  courier: string;
  contact: string;
  operation: string;
  amountMin: string;
  amountMax: string;
  currency: string;
  search: string;
}

export interface UsePendingReceptionsOptions {
  limit?: number;
  initialFilters?: Partial<PendingReceptionFilters>;
  enabled?: boolean;
}

export const DEFAULT_PENDING_RECEPTIONS_FILTERS: PendingReceptionFilters = {
  status: 'pending',
  dateFrom: '',
  dateTo: '',
  courier: '',
  contact: '',
  operation: '',
  amountMin: '',
  amountMax: '',
  currency: '',
  search: '',
};

const isObjectId = (value: string) => /^[0-9a-fA-F]{24}$/.test(value);

const buildQueryParams = (
  filters: PendingReceptionFilters,
  page: number,
  limit: number
): Record<string, string | number> => {
  const params: Record<string, string | number> = {
    page,
    limit,
  };

  if (filters.status) params.status = filters.status;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.courier) {
    const courierValue = filters.courier.trim();
    if (isObjectId(courierValue)) {
      params.courierId = courierValue;
    } else {
      params.courier = courierValue;
    }
  }
  if (filters.contact) {
    const contactValue = filters.contact.trim();
    if (isObjectId(contactValue)) {
      params.contactId = contactValue;
    } else {
      params.contact = contactValue;
    }
  }
  if (filters.operation) {
    const operationValue = filters.operation.trim();
    if (isObjectId(operationValue)) {
      params.operationId = operationValue;
    } else if (!filters.search) {
      params.search = operationValue;
    }
  }
  if (filters.amountMin) params.amountMin = filters.amountMin;
  if (filters.amountMax) params.amountMax = filters.amountMax;
  if (filters.currency) params.currency = filters.currency.toUpperCase();
  if (filters.search) params.search = filters.search.trim();

  return params;
};

export const usePendingReceptions = (
  options: UsePendingReceptionsOptions = {}
) => {
  const { limit = 15, initialFilters = {}, enabled = true } = options;
  const [receptions, setReceptions] = useState<TreasuryReception[]>([]);
  const [filters, setFilters] = useState<PendingReceptionFilters>({
    ...DEFAULT_PENDING_RECEPTIONS_FILTERS,
    ...initialFilters,
  });
  const [pagination, setPagination] = useState(() => ({
    page: 1,
    limit,
    totalItems: 0,
    totalPages: 1,
  }));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const latestRequestRef = useRef(0);

  const fetchReceptions = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const requestId = Date.now();
    latestRequestRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const params = buildQueryParams(filters, page, limit);
      const response = (await getPendingTreasuryReceptions(params)) as TreasuryReceptionsResponse;
      if (latestRequestRef.current !== requestId) {
        return;
      }
      setReceptions(response.items || []);
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        setPagination((prev) => ({
          ...prev,
          page,
          limit,
          totalItems: response.items?.length ?? prev.totalItems,
          totalPages: Math.max(1, Math.ceil((response.items?.length ?? 0) / limit)),
        }));
      }
    } catch (err) {
      const apiError = handleApiError(err);
      if (latestRequestRef.current !== requestId) {
        return;
      }
      setError(apiError);
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [enabled, filters, limit, page]);

  useEffect(() => {
    if (!enabled) {
      setReceptions([]);
      setError(null);
      setLoading(false);
      return;
    }
    fetchReceptions();
  }, [enabled, fetchReceptions]);

  const applyFilters = useCallback((next: PendingReceptionFilters) => {
    setFilters(next);
    setPage(1);
  }, []);

  const patchFilters = useCallback((next: Partial<PendingReceptionFilters>) => {
    setFilters((current) => ({
      ...current,
      ...next,
    }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_PENDING_RECEPTIONS_FILTERS);
    setPage(1);
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    setPage(Math.max(1, nextPage));
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    await fetchReceptions();
  }, [enabled, fetchReceptions]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, limit }));
  }, [limit]);

  return {
    receptions,
    filters,
    pagination,
    loading,
    error,
    page,
    applyFilters,
    patchFilters,
    clearFilters,
    goToPage,
    refresh,
  };
};
