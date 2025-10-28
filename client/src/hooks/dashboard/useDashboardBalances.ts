import { useEffect, useSyncExternalStore } from 'react';
import { apiRequest, handleApiError, subscribeDashboardBalanceRefresh } from '../../utils';
import { ApiError, DashboardBalancesResponse, TreasuryBalance } from '../../types';

export interface UseDashboardBalancesOptions {
  enabled?: boolean;
  pollInterval?: number;
}

interface DashboardBalancesState {
  balances: TreasuryBalance[];
  loading: boolean;
  error: ApiError | null;
}

const DEFAULT_POLL_INTERVAL_MS = 60000;
let state: DashboardBalancesState = {
  balances: [],
  loading: false,
  error: null,
};

const listeners = new Set<() => void>();
let pollTimer: number | null = null;
let refreshUnsubscribe: (() => void) | null = null;
let inFlight: Promise<void> | null = null;
let currentPollInterval = DEFAULT_POLL_INTERVAL_MS;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partial: Partial<DashboardBalancesState>) => {
  state = { ...state, ...partial };
  notify();
};

const fetchBalances = async (): Promise<void> => {
  if (inFlight) {
    return inFlight;
  }

  const shouldShowSpinner = state.balances.length === 0 && !state.loading;
  setState({
    ...(shouldShowSpinner ? { loading: true } : {}),
    error: null,
  });

  inFlight = apiRequest<DashboardBalancesResponse>('/api/dashboard/balances')
    .then((response) => {
      setState({
        balances: response?.balances ?? [],
        loading: false,
        error: null,
      });
    })
    .catch((error) => {
      const apiError = handleApiError(error);
      setState({
        loading: false,
        error: apiError,
      });
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

const start = (pollInterval: number = DEFAULT_POLL_INTERVAL_MS) => {
  if (listeners.size === 0) {
    return;
  }

  // Update current poll interval if it has changed
  if (currentPollInterval !== pollInterval) {
    currentPollInterval = pollInterval;
    // Clear existing timer if interval changed
    if (pollTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  fetchBalances().catch(() => {});

  if (pollTimer === null && typeof window !== 'undefined' && pollInterval > 0) {
    pollTimer = window.setInterval(() => {
      fetchBalances().catch(() => {});
    }, pollInterval);
  }

  if (!refreshUnsubscribe) {
    refreshUnsubscribe = subscribeDashboardBalanceRefresh(() => {
      fetchBalances().catch(() => {});
    });
  }
};

const stop = () => {
  if (listeners.size > 0) {
    return;
  }

  if (pollTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }

  if (refreshUnsubscribe) {
    refreshUnsubscribe();
    refreshUnsubscribe = null;
  }
};

const subscribe = (listener: () => void, pollInterval: number = DEFAULT_POLL_INTERVAL_MS) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    start(pollInterval);
  } else {
    // If there are already listeners but poll interval changed, restart with new interval
    start(pollInterval);
  }
  return () => {
    listeners.delete(listener);
    stop();
  };
};

const noopSubscribe = () => () => {};
const getSnapshot = () => state;
const getDisabledSnapshot = (): DashboardBalancesState => ({
  balances: [],
  loading: false,
  error: null,
});

export const useDashboardBalances = (
  options: UseDashboardBalancesOptions = {}
) => {
  const { enabled = true, pollInterval = DEFAULT_POLL_INTERVAL_MS } = options;

  const snapshot = useSyncExternalStore(
    enabled ? (listener) => subscribe(listener, pollInterval) : noopSubscribe,
    enabled ? getSnapshot : getDisabledSnapshot,
    getSnapshot
  );

  useEffect(() => {
    if (enabled) {
      fetchBalances().catch(() => {});
    }
  }, [enabled]);

  return {
    balances: snapshot.balances,
    loading: enabled ? snapshot.loading : false,
    error: enabled ? snapshot.error : null,
    refresh: fetchBalances,
  };
};
