import { useCallback, useState } from 'react';
import { ApiError, ClientSummary } from '../types';
import { apiRequest, handleApiError } from '../utils/api';

export interface CreateClientPayload {
  firstName: string;
  lastName: string;
  internalOwner: string;
  contactType: 'client' | 'provider';
  cuit?: string | null;
  email?: string | null;
  phone?: string | null;
}

export const useCreateClient = () => {
  const [client, setClient] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (payload: CreateClientPayload): Promise<ClientSummary> => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest<ClientSummary>('/api/clients', {
          method: 'POST',
          body: payload,
        });
        setClient(response);
        return response;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setClient(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    client,
    loading,
    error,
    execute,
    reset,
  };
};
