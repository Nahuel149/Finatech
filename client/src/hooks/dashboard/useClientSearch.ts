import { useEffect, useMemo, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { ClientSummary, ListClientsResponse } from '../../types/client';

type ClientSearchOptions = {
  includeRecentOnEmpty?: boolean;
  recentLimit?: number;
  searchLimit?: number;
};

export const useClientSearch = (
  initialQuery = '',
  options: ClientSearchOptions = {}
) => {
  const { includeRecentOnEmpty = true, recentLimit = 8, searchLimit = 10 } = options;
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q && !includeRecentOnEmpty) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const endpoint = q
          ? `/api/clients?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(searchLimit)}`
          : `/api/clients/recent?limit=${encodeURIComponent(recentLimit)}`;
        const res = await apiRequest<ListClientsResponse>(endpoint, {
          method: 'GET',
          signal: controller.signal as any,
        } as any);
        setItems(res.items || []);
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, includeRecentOnEmpty, recentLimit, searchLimit]);

  const suggestions = useMemo(() => items, [items]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
  };
};
