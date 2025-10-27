import { useCallback } from 'react';
import { useApi } from '../useApi';
import {
  ApiError,
  CreateTreasuryMovementPayload,
  CreateTreasuryMovementResponse,
} from '../../types';

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
