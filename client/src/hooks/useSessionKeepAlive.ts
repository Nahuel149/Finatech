import { useEffect, useRef } from 'react';
import { api } from '../utils';

const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const hasSessionCookie = () => {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith('finatech_session='));
};

interface UseSessionKeepAliveOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export const useSessionKeepAlive = (
  { enabled = true, intervalMs = DEFAULT_KEEP_ALIVE_INTERVAL_MS }: UseSessionKeepAliveOptions = {}
) => {
  const pingInFlightRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    let intervalId: number | null = null;

    const abortOngoingPing = () => {
      if (pingInFlightRef.current) {
        pingInFlightRef.current.abort();
        pingInFlightRef.current = null;
      }
    };

    const sendKeepAlive = async () => {
      if (!hasSessionCookie()) {
        return;
      }

      abortOngoingPing();
      const controller = new AbortController();
      pingInFlightRef.current = controller;

      try {
        await api.keepAlive({ signal: controller.signal });
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('Keep-alive request failed', error);
        }
      } finally {
        if (pingInFlightRef.current === controller) {
          pingInFlightRef.current = null;
        }
      }
    };

    const scheduleInterval = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }

      if (intervalMs > 0) {
        intervalId = window.setInterval(() => {
          if (document.visibilityState !== 'visible') {
            return;
          }
          sendKeepAlive();
        }, intervalMs);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendKeepAlive();
      }
    };

    const handleFocus = () => {
      sendKeepAlive();
    };

    sendKeepAlive();
    scheduleInterval();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      abortOngoingPing();
    };
  }, [enabled, intervalMs]);
};
