import { useCallback, useEffect, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, TreasuryMovement, OperationSuggestion } from '../../types';

interface ReconciliationSuggestionDTO {
  suggestionId: string;
  operationId: string | null;
  model: string | null;
  code: string | null;
  amount: number;
  currency: string;
  contactName: string | null;
  movementType: string | null;
  status: string | null;
  confirmedAt: string | null;
}

interface ReconciliationResponse {
  movement: TreasuryMovement;
  suggestions: ReconciliationSuggestionDTO[];
}

const normalizeSuggestion = (item: ReconciliationSuggestionDTO): OperationSuggestion => ({
  id: item.operationId || item.suggestionId,
  code: item.code,
  model: item.model || 'CurrentAccountMovement',
  amount: item.amount,
  currency: item.currency,
  movementType: item.movementType,
  status: item.status,
  confirmedAt: item.confirmedAt || null,
  description: item.contactName,
});

export const useReconciliationSuggestions = (movementId: string | null) => {
  const [movement, setMovement] = useState<TreasuryMovement | null>(null);
  const [suggestions, setSuggestions] = useState<OperationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!movementId) {
      setMovement(null);
      setSuggestions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ReconciliationResponse>(
        `/api/treasury/movements/${movementId}/suggestions`,
        {
          method: 'GET',
        }
      );

      setMovement(response.movement);
      setSuggestions(
        (response.suggestions || [])
          .filter((item) => Boolean(item.operationId))
          .map(normalizeSuggestion)
      );
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
    } finally {
      setLoading(false);
    }
  }, [movementId]);

  useEffect(() => {
    fetchSuggestions().catch(() => {});
  }, [fetchSuggestions]);

  const reset = useCallback(() => {
    setMovement(null);
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    movement,
    suggestions,
    loading,
    error,
    refresh: fetchSuggestions,
    reset,
  };
};
