import { useCallback, useSyncExternalStore } from 'react';
import { apiRequest, handleApiError } from '../../utils';
import { ApiError, DashboardNotification, DashboardNotificationsResponse } from '../../types';

interface NotificationsState {
  notifications: DashboardNotification[];
  loading: boolean;
  error: ApiError | null;
}

let state: NotificationsState = {
  notifications: [],
  loading: false,
  error: null,
};

const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;
let cachedSnapshot: NotificationsState | null = null;
let lastFetchTs = 0;
const DEDUPE_WINDOW_MS = 750; // Prevent immediate duplicate fetches

const notify = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partial: Partial<NotificationsState>) => {
  state = { ...state, ...partial };
  cachedSnapshot = null; // Invalidate cache on state change
  notify();
};

const fetchNotifications = async (): Promise<void> => {
  const now = Date.now();
  if (inFlight) {
    return inFlight;
  }
  if (now - lastFetchTs < DEDUPE_WINDOW_MS) {
    // Recently fetched; avoid hammering the endpoint
    return Promise.resolve();
  }

  lastFetchTs = now;
  const shouldShowSpinner = state.notifications.length === 0 && !state.loading;
  setState({
    ...(shouldShowSpinner ? { loading: true } : {}),
    error: null,
  });

  inFlight = apiRequest<DashboardNotificationsResponse>('/api/dashboard/notifications')
    .then((response) => {
      setState({
        notifications: response?.notifications ?? [],
        loading: false,
        error: null,
      });
    })
    .catch((error) => {
      const apiError = handleApiError(error);
      setState({ loading: false, error: apiError });
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

const subscribe = (listener: () => void) => {
  const wasEmpty = listeners.size === 0;
  listeners.add(listener);
  if (wasEmpty) {
    // Trigger initial fetch on first subscription
    // Defer to next tick to avoid nested updates during mount
    if (typeof window !== 'undefined') {
      try {
        (window as any).queueMicrotask?.(() => fetchNotifications().catch(() => {}));
      } catch {
        window.setTimeout(() => fetchNotifications().catch(() => {}), 0);
      }
    } else {
      Promise.resolve().then(() => fetchNotifications().catch(() => {}));
    }
  }
  return () => {
    listeners.delete(listener);
  };
};

const noopSubscribe = () => () => {};

const getSnapshot = (): NotificationsState => {
  if (!cachedSnapshot) {
    cachedSnapshot = { ...state };
  }
  return cachedSnapshot;
};

const getDisabledSnapshot = (): NotificationsState => ({
  notifications: [],
  loading: false,
  error: null,
});

export const useDashboardNotifications = (enabled: boolean = true) => {
  const subscribeFn = useCallback((listener: () => void) => subscribe(listener), []);

  const snapshot = useSyncExternalStore(
    enabled ? subscribeFn : noopSubscribe,
    enabled ? getSnapshot : getDisabledSnapshot,
    getSnapshot
  );

  return {
    notifications: snapshot.notifications,
    loading: enabled ? snapshot.loading : false,
    error: enabled ? snapshot.error : null,
    refresh: fetchNotifications,
  };
};