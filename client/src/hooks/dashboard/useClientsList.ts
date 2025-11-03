import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, ClientSummary, ListClientsResponse } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

export const useClientsList = (limit = 25) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const requestIdRef = useRef(0);

  const fetchClients = useCallback(
    async (searchTerm = '') => {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      setLastQuery(searchTerm);

      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (searchTerm.trim().length > 0) {
          params.append('query', searchTerm.trim());
        }

        const response = await apiRequest<ListClientsResponse>(
          `/api/clients?${params.toString()}`,
          {
            method: 'GET',
          }
        );

        if (requestIdRef.current === requestId) {
          setClients(response.items ?? []);
        }
      } catch (err) {
        if (requestIdRef.current === requestId) {
          const apiError = handleApiError(err);
          setError(apiError);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refresh = useCallback(() => {
    fetchClients(lastQuery);
  }, [fetchClients, lastQuery]);

  const search = useCallback(
    (term: string) => {
      fetchClients(term);
    },
    [fetchClients],
  );

  return {
    clients,
    loading,
    error,
    refresh,
    search,
    setClients,
  };
};
