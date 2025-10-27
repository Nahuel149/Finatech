import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../useApi';
import { ListTransfersResponse, TransferOperation } from '../../types';

export interface UseTransferOperationsOptions {
  limit?: number;
  skip?: number;
  query?: string; // local filter by code/contactName
}

export const useTransferOperations = (opts: UseTransferOperationsOptions = {}) => {
  const { limit = 20, skip = 0, query = '' } = opts;
  const endpoint = `/api/transfers/pesos?limit=${encodeURIComponent(limit)}&skip=${encodeURIComponent(skip)}`;
  const { data, loading, error, execute } = useApi<ListTransfersResponse>(endpoint);
  const [search, setSearch] = useState(query);

  useEffect(() => {
    execute().catch(() => {});
  }, [execute]);

  const items: TransferOperation[] = useMemo(() => data?.items ?? [], [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((op) =>
      (op.operationCode || '').toLowerCase().includes(q) ||
      (op.distributionLines || []).some((l) => (l.contactName || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  return {
    items: filtered,
    total: items.length,
    loading,
    error,
    refresh: execute,
    search,
    setSearch,
  };
};
