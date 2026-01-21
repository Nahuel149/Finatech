import { useEffect, useMemo } from 'react';
import { useApi } from '../useApi';
import { ApiError } from '../../types/auth';
import { TreasuryMovement } from '../../types/treasury';

interface MovementDetailResponse {
  movement: TreasuryMovement;
}

export const useTreasuryMovement = (movementId?: string | null) => {
  const endpoint = movementId ? `/api/treasury/movements/${movementId}` : '';
  const { data, loading, error, execute, reset } = useApi<MovementDetailResponse>(endpoint, {
    immediate: false,
  });

  useEffect(() => {
    if (!movementId) {
      reset();
      return;
    }

    execute().catch(() => {});
  }, [execute, movementId, reset]);

  return {
    movement: useMemo(() => data?.movement ?? null, [data]),
    loading,
    error: (error as ApiError) || null,
    refresh: execute,
  };
};
