import { useCallback, useState } from 'react';
import { ApiError } from '../types/auth';
import { LocationSearchPayload, LocationSearchResult } from '../types/location';
import { apiRequest, handleApiError } from '../utils/api';

interface SearchOptions {
  countrycodes?: string;
  limit?: number;
}

const ENDPOINT = '/api/location/geocode';

export const useGeolocation = () => {
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const searchAddress = useCallback(async (address: string, options: SearchOptions = {}) => {
    const trimmed = address.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('query', trimmed);
      if (options.countrycodes) {
        params.set('countrycodes', options.countrycodes);
      }
      if (options.limit) {
        params.set('limit', String(options.limit));
      }

      const payload = await apiRequest<LocationSearchPayload>(`${ENDPOINT}?${params.toString()}`, {
        method: 'GET',
      });
      setResults(payload?.results || []);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    searchAddress,
    clear: () => {
      setResults([]);
      setError(null);
    },
  };
};
