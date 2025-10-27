import { useCallback, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, TreasuryMovement } from '../../types';

interface CancelResponse {
  movement: TreasuryMovement;
}

export const useCancelTreasuryMovement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const cancelMovement = useCallback(async (movementId: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<CancelResponse>(`/api/treasury/movements/${movementId}/cancel`, {
        method: 'POST',
        body: reason ? { reason } : {},
      });
      return response.movement;
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    cancelMovement,
    loading,
    error,
    reset,
  };
};
