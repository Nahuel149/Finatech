import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { ApiError } from '../../types';
import { apiRequest, handleApiError } from '../../utils/api';

export interface MarketRateOverride {
  baseAsset: string;
  quoteAsset: string;
  rate: number;
  buyRate?: number | null;
  sellRate?: number | null;
  selectedSide?: 'buy' | 'sell';
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
  const dataRef = useRef<MarketRateOverride | null>(null);

  // In-flight dedupe and soft cache across components
  const key = useMemo(() => `${baseAsset}:${quoteAsset}`, [baseAsset, quoteAsset]);
  const DEDUPE_WINDOW_MS = 750; // prevent immediate duplicate calls (StrictMode, multi-mount)
  const CACHE_TTL_MS = 25_000; // align with server-side cache window without overextending

  // Module-level stores to dedupe concurrent requests and reuse fresh data
  // Ensure 'shared' reference is stable for hooks dependency analysis
  const shared = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (!g.__latestMarketRateShared) {
      g.__latestMarketRateShared = {
        inFlight: new Map<string, Promise<MarketRateOverride | null>>(),
        lastFetchTs: new Map<string, number>(),
        cache: new Map<string, { data: MarketRateOverride | null; expiry: number }>(),
      };
    }
    return g.__latestMarketRateShared as {
      inFlight: Map<string, Promise<MarketRateOverride | null>>;
      lastFetchTs: Map<string, number>;
      cache: Map<string, { data: MarketRateOverride | null; expiry: number }>;
    };
  }, []);

  const fetchRate = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError(null);
      return null;
    }

    // Serve from cache if still valid
    const cached = shared.cache.get(key);
    const now = Date.now();
    if (cached && cached.expiry > now) {
      setError(null);
      setData(cached.data);
      setLoading(false);
      return cached.data;
    }

    // Dedupe rapid successive calls per pair
    const lastTs = shared.lastFetchTs.get(key) || 0;
    if (now - lastTs < DEDUPE_WINDOW_MS) {
      const active = shared.inFlight.get(key);
      if (active) {
        try {
          const result = await active;
          setError(null);
          setData(result);
          setLoading(false);
          return result;
        } catch (e) {
          const apiErr = handleApiError(e);
          setError(apiErr);
          setData(null);
          setLoading(false);
          return null;
        }
      }
      // If no active in-flight and no cache, avoid hammering; show previous state
      setLoading(false);
      return dataRef.current;
    }

    shared.lastFetchTs.set(key, now);

    // If a request for this pair is already in-flight, reuse it
    const existing = shared.inFlight.get(key);
    if (existing) {
      try {
        setLoading(true);
        setError(null);
        const result = await existing;
        setData(result);
        setLoading(false);
        return result;
      } catch (e) {
        const apiErr = handleApiError(e);
        setError(apiErr);
        setData(null);
        setLoading(false);
        return null;
      }
    }

    setLoading(true);
    setError(null);

    const promise = apiRequest<{ override: MarketRateOverride | null }>(
      `/api/rates/market?baseAsset=${encodeURIComponent(baseAsset)}&quoteAsset=${encodeURIComponent(quoteAsset)}`
    )
      .then(async (payload) => {
        let override = payload?.override ?? null;

        // Fallbacks: official USD/ARS, then public FX API for any pair
        const isUsdArsPair =
          baseAsset.toUpperCase() === 'USD' && quoteAsset.toUpperCase() === 'ARS';
        if (!override) {
          if (isUsdArsPair) {
            try {
              const official = await apiRequest<{ quote: any }>(
                `/api/rates/market/official?baseAsset=${encodeURIComponent(baseAsset)}&quoteAsset=${encodeURIComponent(quoteAsset)}`
              );
              if (official?.quote?.buyRate && official?.quote?.sellRate) {
                override = {
                  baseAsset: baseAsset,
                  quoteAsset: quoteAsset,
                  buyRate: Number(official.quote.buyRate),
                  sellRate: Number(official.quote.sellRate),
                  rate: Number(official.quote.sellRate),
                  selectedSide: 'sell',
                  validFrom: new Date().toISOString(),
                  source: official.quote.source || 'official-fallback',
                  createdAt: new Date().toISOString(),
                };
              }
            } catch (fallbackErr: any) {
              setError(handleApiError(fallbackErr));
            }
          } else {
            try {
              const response = await fetch(
                `https://api.exchangerate.host/convert?from=${encodeURIComponent(
                  baseAsset
                )}&to=${encodeURIComponent(quoteAsset)}`
              );
              const json = await response.json();
              const fxRate = Number(json?.result);
              if (Number.isFinite(fxRate) && fxRate > 0) {
                const nowIso = new Date().toISOString();
                override = {
                  baseAsset,
                  quoteAsset,
                  rate: fxRate,
                  buyRate: fxRate,
                  sellRate: fxRate,
                  selectedSide: 'sell',
                  validFrom: nowIso,
                  source: 'exchangerate-host',
                  createdAt: nowIso,
                };
              }
            } catch {
              // Silent: leave override null to allow manual input
            }
          }
        }

        // Soft cache the fresh value
        shared.cache.set(key, { data: override, expiry: Date.now() + CACHE_TTL_MS });
        setData(override);
        return override;
      })
      .catch((err) => {
        const apiErr = handleApiError(err);
        setError(apiErr);
        setData(null);
        return null;
      })
      .finally(() => {
        shared.inFlight.delete(key);
        setLoading(false);
      });

    shared.inFlight.set(key, promise);
    return promise;
  }, [enabled, key, baseAsset, quoteAsset, shared]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

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
