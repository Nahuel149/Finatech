import { useCallback, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { TreasuryMovement } from '../../types/treasury';

interface CompensateResponse {
  movement: TreasuryMovement;
}

interface CompensatePayload {
  amount?: number;
  contactId?: string;
  operation?: {
    id: string;
    model?: string | null;
  };
}

export const useCompensateTreasuryMovement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const compensateMovement = useCallback(
    async (movementId: string, payload: CompensatePayload) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiRequest<CompensateResponse>(
          `/api/treasury/movements/${movementId}/compensate`,
          {
            method: 'POST',
            body: payload,
          }
        );
        return response.movement;
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
    setLoading(false);
    setError(null);
  }, []);

  return {
    compensateMovement,
    loading,
    error,
    reset,
  };
};
