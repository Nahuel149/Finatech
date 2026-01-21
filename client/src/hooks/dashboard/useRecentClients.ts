import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../types/auth';
import { ClientSummary, ListClientsResponse } from '../../types/client';
import { apiRequest, handleApiError } from '../../utils/api';

export const useRecentClients = (limit = 8) => {
  const [items, setItems] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<ListClientsResponse>(
        `/api/clients/recent?limit=${encodeURIComponent(limit)}`,
        { method: 'GET' }
      );
      setItems(response.items || []);
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  return {
    recent: items,
    loading,
    error,
    refresh: fetchRecent,
  };
};
