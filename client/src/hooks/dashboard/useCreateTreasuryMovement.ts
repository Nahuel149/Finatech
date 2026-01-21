import { useCallback } from 'react';
import { useApi } from '../useApi';
import { ApiError } from '../../types/auth';
import { CreateTreasuryMovementPayload, CreateTreasuryMovementResponse } from '../../types/treasury';

export const useCreateTreasuryMovement = () => {
  const { execute, loading, error, reset } = useApi<CreateTreasuryMovementResponse>(
    '/api/treasury/movements',
    { immediate: false }
  );

  const createMovement = useCallback(
    (payload: CreateTreasuryMovementPayload) =>
      execute({
        method: 'POST',
        body: payload,
      }),
    [execute]
  );

  return {
    createMovement,
    loading,
    error: error as ApiError | null,
    reset,
  };
};
