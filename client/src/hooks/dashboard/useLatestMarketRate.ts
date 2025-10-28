import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

export interface MarketRateOverride {
  baseAsset: string;
  quoteAsset: string;
  rate: number;
  validFrom: string;
  source: string;
  createdAt: string;
}

export interface UseLatestMarketRateOptions {
  baseAsset?: string;
  quoteAsset?: string;
  enabled?: boolean;
}

export interface UseLatestMarketRateResult {
  data: MarketRateOverride | null;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<MarketRateOverride | null>;
}

export const useLatestMarketRate = (
  options: UseLatestMarketRateOptions = {}
): UseLatestMarketRateResult => {
  const { baseAsset = 'USD', quoteAsset = 'ARS', enabled = true } = options;
  const [data, setData] = useState<MarketRateOverride | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRate = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await apiRequest<{ override: MarketRateOverride | null }>(
        `/api/rates/market?baseAsset=${encodeURIComponent(baseAsset)}&quoteAsset=${encodeURIComponent(quoteAsset)}`
      );
      const override = payload?.override ?? null;
      setData(override);
      return override;
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [baseAsset, quoteAsset, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    fetchRate().catch(() => {});
  }, [enabled, fetchRate]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      refresh: fetchRate,
    }),
    [data, loading, error, fetchRate]
  );
};
