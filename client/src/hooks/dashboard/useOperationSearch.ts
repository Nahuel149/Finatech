import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../types/auth';
import { OperationSuggestion } from '../../types/treasury';
import { apiRequest, handleApiError } from '../../utils/api';

interface UseOperationSearchOptions {
  minimumQueryLength?: number;
  limit?: number;
  contactId?: string | null;
  enableEmptyQueryWithContact?: boolean;
}

export const useOperationSearch = (options: UseOperationSearchOptions = {}) => {
  const {
    minimumQueryLength = 3,
    limit = 50,
    contactId = null,
    enableEmptyQueryWithContact = false,
  } = options;
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [items, setItems] = useState<OperationSuggestion[]>([]);
  const normalizedContactId = contactId || null;

  useEffect(() => {
    const trimmed = query.trim();
    const sanitized = trimmed.replace(/#/g, '').trim();
    const hasQuery = sanitized.length >= minimumQueryLength;
    const shouldFetchByContact = enableEmptyQueryWithContact && Boolean(normalizedContactId);
    const shouldFetch = hasQuery || shouldFetchByContact;

    if (!shouldFetch) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const searchParam = hasQuery ? sanitized : '';

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        if (searchParam) {
          params.set('search', searchParam);
        }
        if (normalizedContactId) {
          params.set('contactId', normalizedContactId);
        }

        const response = await apiRequest<{ suggestions: OperationSuggestion[] }>(
          `/api/treasury/operations/suggestions?${params.toString()}`,
          {
            method: 'GET',
            signal: controller.signal as any,
          } as any
        );

        const normalized = response.suggestions || [];
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
  }, [enableEmptyQueryWithContact, limit, minimumQueryLength, normalizedContactId, query]);

  const suggestions = useMemo(() => items, [items]);

  const reset = useCallback(() => {
    setQuery('');
    setItems([]);
    setLoading(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    const sanitized = query.trim().replace(/#/g, '').trim();
    const hasQuery = sanitized.length >= minimumQueryLength;
    const shouldFetchByContact = enableEmptyQueryWithContact && Boolean(normalizedContactId);
    const shouldFetch = hasQuery || shouldFetchByContact;

    if (!shouldFetch) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (hasQuery) {
        params.set('search', sanitized);
      }
      if (normalizedContactId) {
        params.set('contactId', normalizedContactId);
      }
      const response = await apiRequest<{ suggestions: OperationSuggestion[] }>(
        `/api/treasury/operations/suggestions?${params.toString()}`,
        {
          method: 'GET',
        }
      );
      const normalized = response.suggestions || [];
      setItems(normalized.slice(0, 10));
    } catch (err) {
      setError(handleApiError(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enableEmptyQueryWithContact, limit, minimumQueryLength, normalizedContactId, query]);

  return {
    query,
    setQuery,
    loading,
    error,
    suggestions,
    reset,
    refresh,
  };
};
