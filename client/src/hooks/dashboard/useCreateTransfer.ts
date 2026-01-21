import { useState, useCallback } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { CreateTransferPayload, CreateTransferResponse } from '../../types/transfer';

export const useCreateTransfer = () => {
  const [data, setData] = useState<CreateTransferResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (payload: CreateTransferPayload): Promise<CreateTransferResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<CreateTransferResponse>('/api/transfers/pesos', {
        method: 'POST',
        body: payload,
      });
      setData(response);
      return response;
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
      throw apiErr;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};