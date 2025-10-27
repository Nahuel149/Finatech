const DASHBOARD_BALANCE_REFRESH_EVENT = 'dashboard:balances:refresh';

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
