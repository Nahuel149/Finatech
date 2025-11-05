import { buildApiUrl } from './api';

const DASHBOARD_BALANCE_REFRESH_EVENT = 'dashboard:balances:refresh';
const BALANCE_STREAM_URL = buildApiUrl('/api/dashboard/balances/events');
const RECONNECT_DELAY_MS = 5000;

export const emitDashboardBalanceRefresh = () => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  window.dispatchEvent(new CustomEvent(DASHBOARD_BALANCE_REFRESH_EVENT));
};

export const subscribeDashboardBalanceRefresh = (handler: () => void) => {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => {};
  }
  const listener = () => handler();
  window.addEventListener(DASHBOARD_BALANCE_REFRESH_EVENT, listener);
  return () => {
    window.removeEventListener(DASHBOARD_BALANCE_REFRESH_EVENT, listener);
  };
};

export const BALANCE_REFRESH_EVENT = DASHBOARD_BALANCE_REFRESH_EVENT;

let balanceStream: EventSource | null = null;
let reconnectTimer: number | null = null;
let manualClose = false;

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const scheduleReconnect = () => {
  if (manualClose || reconnectTimer) {
    return;
  }
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    openBalanceStream();
  }, RECONNECT_DELAY_MS);
};

const handleStreamMessage = (event: MessageEvent<string>) => {
  try {
    const payload = event.data ? JSON.parse(event.data) : null;
    if (payload && typeof payload === 'object' && payload.type === 'connected') {
      return;
    }
  } catch (error) {
    // Ignore JSON parsing failures; we'll still emit a refresh.
  }
  emitDashboardBalanceRefresh();
};

const openBalanceStream = () => {
  if (manualClose || balanceStream || typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return;
  }

  try {
    const source = new EventSource(BALANCE_STREAM_URL, { withCredentials: true });

    source.addEventListener('balance-update', handleStreamMessage as EventListener);
    source.addEventListener('message', handleStreamMessage as EventListener);
    source.addEventListener('open', clearReconnectTimer);
    source.addEventListener('error', () => {
      if (manualClose) {
        return;
      }
      source.close();
      balanceStream = null;
      scheduleReconnect();
    });

    balanceStream = source;
  } catch (error) {
    scheduleReconnect();
  }
};

export const ensureDashboardBalanceStream = () => {
  if (typeof window === 'undefined') {
    return;
  }
  manualClose = false;
  if (!balanceStream) {
    openBalanceStream();
  }
};

export const stopDashboardBalanceStream = () => {
  manualClose = true;
  clearReconnectTimer();
  if (balanceStream) {
    balanceStream.removeEventListener('balance-update', handleStreamMessage as EventListener);
    balanceStream.removeEventListener('message', handleStreamMessage as EventListener);
    balanceStream.close();
    balanceStream = null;
  }
};
