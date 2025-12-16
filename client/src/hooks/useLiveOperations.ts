import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveOperationsResponse, LiveOperationImpacts } from '../types';
import { apiRequest, buildApiUrl } from '../utils';

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

export const useLiveOperations = () => {
  const [state, setState] = useState<LiveOperationsState>(DEFAULT_STATE);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);

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
      setStatus((prev) => (prev === 'error' ? 'polling' : prev === 'idle' ? 'polling' : prev));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar operaciones activas');
      setStatus('error');
    }
  }, [applySnapshot]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollTimerRef.current = window.setInterval(fetchSnapshot, 5000);
    setStatus('polling');
  }, [fetchSnapshot, stopPolling]);

  const stopSse = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const startSse = useCallback(() => {
    stopSse();
    clearRetry();
    const url = buildApiUrl('/api/live-ops/operations/events');
    try {
      const es = new EventSource(url, { withCredentials: true });
      sseRef.current = es;
      es.addEventListener('live-operations', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'error') {
            setError(data.message || 'Stream error');
            setStatus('error');
            return;
          }
          if (data.type === 'connected') {
            setStatus('live');
            setError(null);
            return;
          }
          applySnapshot(data);
          setStatus('live');
          setError(null);
        } catch (parseError) {
          // ignore malformed payloads
        }
      });
      es.onerror = () => {
        stopSse();
        setStatus('error');
        setError('Stream desconectado, reintentando y usando polling');
        startPolling();
        // retry SSE in background
        clearRetry();
        retryTimerRef.current = window.setTimeout(() => {
          startSse();
        }, 8000);
      };
    } catch (err) {
      setStatus('error');
      setError('No se pudo abrir el stream, usando polling');
      startPolling();
      clearRetry();
      retryTimerRef.current = window.setTimeout(() => {
        startSse();
      }, 8000);
    }
  }, [applySnapshot, clearRetry, startPolling, stopSse]);

  useEffect(() => {
    fetchSnapshot();
    startSse();
    return () => {
      stopPolling();
      stopSse();
      clearRetry();
    };
  }, [clearRetry, fetchSnapshot, startPolling, startSse, stopPolling, stopSse]);

  const connectionStatus = status;

  return {
    ...state,
    status: connectionStatus,
    error,
    refresh: fetchSnapshot,
  };
};
