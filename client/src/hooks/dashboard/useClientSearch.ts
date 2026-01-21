import { useEffect, useMemo, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { ClientSummary, ListClientsResponse } from '../../types/client';

export const useClientSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
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
        const res = await apiRequest<ListClientsResponse>(`/api/clients?q=${encodeURIComponent(q)}`, {
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
  }, [query]);

  const suggestions = useMemo(() => items, [items]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
  };
};