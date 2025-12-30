import { useCallback, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import {
  ApiError,
  UpdateTreasuryMovementPayload,
  UpdateTreasuryMovementResponse,
} from '../../types';

export const useUpdateTreasuryMovement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateMovement = useCallback(
    async (movementId: string, payload: UpdateTreasuryMovementPayload) => {
      setLoading(true);
      setError(null);
      try {
        return await apiRequest<UpdateTreasuryMovementResponse>(
          `/api/treasury/movements/${movementId}`,
          {
            method: 'PUT',
            body: payload,
          }
        );
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError);
        throw apiError;
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
    updateMovement,
    loading,
    error,
    reset,
  };
};
