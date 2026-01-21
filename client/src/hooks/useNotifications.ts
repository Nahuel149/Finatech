import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardNotifications } from './dashboard/useDashboardNotifications';

export type NotificationLevel = 'info' | 'warning' | 'success' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  level: NotificationLevel;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const useNotifications = () => {
  const {
    notifications: fetchedNotifications,
    loading,
    error,
    refresh,
    markRead: markReadRemote,
    markAllRead: markAllReadRemote,
  } = useDashboardNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setNotifications((prev) => {
      const previousById = new Map(prev.map((notification) => [notification.id, notification]));
      return fetchedNotifications.map((notification) => {
        const existing = previousById.get(notification.id);
        const level: NotificationLevel = notification.severity ?? 'info';
        return {
          id: notification.id,
          title: notification.title,
          description: notification.description ?? notification.message ?? '',
          createdAt: notification.createdAt,
          level,
          read: existing?.read ?? Boolean(notification.read),
          actionLabel: notification.actionLabel,
          actionUrl: notification.actionUrl ?? null,
          metadata: notification.metadata ?? null,
        };
      });
    });
  }, [fetchedNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );

  const recentNotifications = useMemo(
    () => sortedNotifications.slice(0, 10),
    [sortedNotifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      let previous: NotificationItem[] = [];
      setNotifications((prev) => {
        previous = prev;
        return prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        );
      });

      try {
        await markReadRemote(id);
      } catch (err) {
        setNotifications(previous);
        throw err;
      }
    },
    [markReadRemote]
  );

  const markAllAsRead = useCallback(async () => {
    let previous: NotificationItem[] = [];
    setNotifications((prev) => {
      previous = prev;
      return prev.map((notification) => ({ ...notification, read: true }));
    });

    try {
      await markAllReadRemote();
    } catch (err) {
      setNotifications(previous);
      throw err;
    }
  }, [markAllReadRemote]);

  const addNotification = useCallback(
    (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
      setNotifications((prev) => [
        {
          ...notification,
          id: `notif-${Date.now()}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  return {
    notifications: recentNotifications,
    allNotifications: sortedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    loading,
    error,
    refresh,
  };
};
