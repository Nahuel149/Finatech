import { useEffect } from 'react';

const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const hasSessionCookie = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('finatech_session='));
};

interface InactivityOptions {
  timeoutMs?: number;
  enabled?: boolean;
}

export const useInactivityLogout = (
  onTimeout: () => void | Promise<void>,
  { timeoutMs = DEFAULT_IDLE_TIMEOUT_MS, enabled = true }: InactivityOptions = {}
) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    let timeoutId: number | null = null;
    let timeoutTriggered = false;

    const clearTimer = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleTimeout = () => {
      clearTimer();

      if (!hasSessionCookie()) {
        timeoutTriggered = false;
        return;
      }

      timeoutId = window.setTimeout(async () => {
        if (timeoutTriggered || !hasSessionCookie()) {
          return;
        }

        timeoutTriggered = true;

        try {
          await Promise.resolve(onTimeout());
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Error al cerrar sesión por inactividad', error);
        }
      }, timeoutMs);
    };

    const handleActivity = () => {
      timeoutTriggered = false;
      scheduleTimeout();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];

    events.forEach((event) => window.addEventListener(event, handleActivity));
    document.addEventListener('visibilitychange', handleVisibility);
    scheduleTimeout();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimer();
    };
  }, [enabled, onTimeout, timeoutMs]);
};
