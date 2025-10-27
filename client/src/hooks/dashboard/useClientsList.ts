import { useCallback, useEffect, useState } from 'react';
import { ApiError, ClientSummary, ListClientsResponse } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

export const useClientsList = (limit = 25) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ListClientsResponse>(
        `/api/clients?limit=${limit}`,
        {
          method: 'GET',
        }
      );
      setClients(response.items ?? []);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refresh = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    refresh,
    setClients,
  };
};
