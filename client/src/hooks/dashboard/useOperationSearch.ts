import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  ListTransfersResponse,
  OperationSuggestion,
  TransferOperation,
} from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

const normalizeOperationToSuggestion = (operation: TransferOperation): OperationSuggestion => {
  const baseCode = operation.operationCode || operation.id;
  const displayCode = baseCode ? `#${baseCode}` : null;

  return {
    id: operation.id,
    code: displayCode,
    model: 'TransferOperation',
    amount: operation.totalAmount,
    currency: operation.currency,
    movementType: operation.movementType,
    status: operation.status,
    confirmedAt: operation.confirmedAt,
    description: operation.distributionLines?.[0]?.contactName ?? null, // Use null as default instead of redundant null/undefined
  };
};

interface UseOperationSearchOptions {
  minimumQueryLength?: number;
  limit?: number;
}

export const useOperationSearch = (options: UseOperationSearchOptions = {}) => {
  const { minimumQueryLength = 3, limit = 50 } = options;
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [items, setItems] = useState<OperationSuggestion[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    const sanitized = trimmed.replace(/#/g, '').trim();

    if (sanitized.length < minimumQueryLength) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await apiRequest<ListTransfersResponse>(
          `/api/transfers/pesos?limit=${encodeURIComponent(limit)}&skip=0&search=${encodeURIComponent(
            sanitized
          )}`,
          {
            method: 'GET',
            signal: controller.signal as any,
          } as any
        );

        const rawItems: TransferOperation[] = response.items ?? [];
        const normalized = rawItems.map((op) => normalizeOperationToSuggestion(op));
        setItems(normalized.slice(0, 10));
      } catch (err) {
        setError(handleApiError(err));
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [limit, minimumQueryLength, query]);

  const suggestions = useMemo(() => items, [items]);

  const reset = useCallback(() => {
    setQuery('');
    setItems([]);
    setLoading(false);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    loading,
    error,
    suggestions,
    reset,
  };
};
