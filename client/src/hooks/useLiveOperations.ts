import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveOperationsResponse, LiveOperationImpacts } from '../types';
import { apiRequest } from '../utils';

type ConnectionStatus = 'idle' | 'live' | 'polling' | 'error';

interface LiveOperationsState {
  items: LiveOperationsResponse['items'];
  totals: LiveOperationImpacts;
  weightedMarginPercent: number | null;
  timestamp: string | null;
}

const DEFAULT_STATE: LiveOperationsState = {
  items: [],
  totals: { cash: 0, transfers: 0, usd: 0 },
  weightedMarginPercent: null,
  timestamp: null,
};

const POLL_INTERVAL_MS = 60000;

export const useLiveOperations = () => {
  const [state, setState] = useState<LiveOperationsState>(DEFAULT_STATE);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const applySnapshot = useCallback((payload: LiveOperationsResponse) => {
    setState({
      items: payload.items || [],
      totals: payload.totals || { cash: 0, transfers: 0, usd: 0 },
      weightedMarginPercent:
        typeof payload.weightedMarginPercent === 'number'
          ? payload.weightedMarginPercent
          : null,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  }, []);

  const fetchSnapshot = useCallback(async () => {
    try {
      const payload = await apiRequest<LiveOperationsResponse>('/api/live-ops/operations/active');
      applySnapshot(payload);
      setStatus('live');
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar operaciones activas');
      setStatus('error');
    }
  }, [applySnapshot]);

  useEffect(() => {
    fetchSnapshot();

    if (typeof window !== 'undefined') {
      pollTimerRef.current = window.setInterval(() => {
        fetchSnapshot();
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchSnapshot]);

  return {
    ...state,
    status,
    error,
    refresh: fetchSnapshot,
  };
};
