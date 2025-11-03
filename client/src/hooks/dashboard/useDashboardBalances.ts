import { useCallback, useSyncExternalStore } from 'react';
import {
  apiRequest,
  handleApiError,
  subscribeDashboardBalanceRefresh,
  ensureDashboardBalanceStream,
  stopDashboardBalanceStream,
} from '../../utils';
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
let cachedSnapshot: DashboardBalancesState | null = null;
let lastStateHash: string | null = null;

const notify = () => {
  listeners.forEach((listener) => listener());
};

const createStateHash = (state: DashboardBalancesState): string => {
  return JSON.stringify({
    balances: state.balances.map(b => ({ id: b.id, amount: b.amount, status: b.status, updatedAt: b.updatedAt })),
    loading: state.loading,
    error: state.error?.message || null
  });
};

const setState = (partial: Partial<DashboardBalancesState>) => {
  const newState = { ...state, ...partial };
  const newHash = createStateHash(newState);
  
  // Only update if state actually changed
  if (newHash !== lastStateHash) {
    state = newState;
    lastStateHash = newHash;
    cachedSnapshot = null; // Invalidate cache when state changes
    notify();
  }
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

  ensureDashboardBalanceStream();

  // Update current poll interval if it has changed
  if (currentPollInterval !== pollInterval) {
    currentPollInterval = pollInterval;
    // Clear existing timer if interval changed
    if (pollTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // Defer the initial fetch to the next tick to avoid triggering
  // synchronous store updates during subscription mount, which can
  // produce nested update loops in React's passive effects.
  if (typeof window !== 'undefined') {
    // Use microtask if available, otherwise fallback to setTimeout(0)
    try {
      (window as any).queueMicrotask?.(() => {
        fetchBalances().catch(() => {});
      });
    } catch {
      window.setTimeout(() => {
        fetchBalances().catch(() => {});
      }, 0);
    }
  } else {
    // In non-browser environments, just call asynchronously
    Promise.resolve().then(() => fetchBalances().catch(() => {}));
  }

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

  stopDashboardBalanceStream();
};

const subscribe = (listener: () => void, pollInterval: number = DEFAULT_POLL_INTERVAL_MS) => {
  const wasEmpty = listeners.size === 0;
  listeners.add(listener);
  if (wasEmpty) {
    // Only start when the first listener subscribes
    start(pollInterval);
  } else if (pollInterval !== currentPollInterval) {
    // Restart if the poll interval changes
    start(pollInterval);
  }
  return () => {
    listeners.delete(listener);
    stop();
  };
};

// Cache the snapshot to prevent unnecessary re-renders
const getSnapshot = (): DashboardBalancesState => {
  if (!cachedSnapshot) {
    // Create a deep copy to ensure immutability
    cachedSnapshot = {
      balances: [...state.balances],
      loading: state.loading,
      error: state.error
    };
  }
  return cachedSnapshot;
};

// Stable disabled snapshot - never changes
const DISABLED_SNAPSHOT: DashboardBalancesState = {
  balances: [],
  loading: false,
  error: null,
};

const getDisabledSnapshot = (): DashboardBalancesState => DISABLED_SNAPSHOT;

export const useDashboardBalances = (
  options: UseDashboardBalancesOptions = {}
) => {
  const { enabled = true, pollInterval = DEFAULT_POLL_INTERVAL_MS } = options;

  // Memoize subscribe function to avoid resubscription on every render
  const subscribeFn = useCallback(
    (listener: () => void) => {
      if (!enabled) return () => {};
      return subscribe(listener, pollInterval);
    },
    [enabled, pollInterval]
  );

  // Use stable snapshot function references - don't recreate on every render
  const snapshot = useSyncExternalStore(
    subscribeFn,
    enabled ? getSnapshot : getDisabledSnapshot,
    enabled ? getSnapshot : getDisabledSnapshot
  );

  return {
    balances: snapshot.balances,
    loading: enabled ? snapshot.loading : false,
    error: enabled ? snapshot.error : null,
    refresh: fetchBalances,
  };
};
