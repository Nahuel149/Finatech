import { useEffect, useMemo, useState } from 'react';
import { apiRequest, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { OperationSuggestion } from '../../types/treasury';

type OperationSuggestionsOptions = {
  limit?: number;
};

type OperationSuggestionsResponse = {
  suggestions?: OperationSuggestion[];
};

export const useOperationSuggestions = (
  query = '',
  options: OperationSuggestionsOptions = {}
) => {
  const { limit = 5 } = options;
  const [items, setItems] = useState<OperationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await apiRequest<OperationSuggestionsResponse>(
          `/api/treasury/operations/suggestions?search=${encodeURIComponent(q)}&limit=${encodeURIComponent(
            limit
          )}`,
          {
            method: 'GET',
            signal: controller.signal as any,
          } as any
        );
        setItems(res.suggestions || []);
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, limit]);

  const suggestions = useMemo(() => items, [items]);

  return {
    suggestions,
    loading,
    error,
  };
};
