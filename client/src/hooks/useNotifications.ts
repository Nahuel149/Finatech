import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type NotificationLevel = 'info' | 'warning' | 'success' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  level: NotificationLevel;
  read: boolean;
  actionLabel?: string;
}

const buildInitialNotifications = (): NotificationItem[] => [
  {
    id: 'notif-1',
    title: 'Transferencia completada',
    description: 'La operación #OP-2024-1049 fue confirmada por Tesorería.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    level: 'success',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Incidencia logística',
    description: 'Se reportó una incidencia en el movimiento MOV-2024-003.',
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    level: 'warning',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Recordatorio de conciliación',
    description: 'Tienes conciliaciones pendientes para hoy.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    level: 'info',
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Nuevo comentario en operación',
    description: 'María García comentó en la operación OP-2024-1032.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    level: 'info',
    read: true,
  },
];

let notificationsState: NotificationItem[] = buildInitialNotifications();
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
};

const getSnapshot = () => notificationsState;

const updateNotifications = (
  updater: (prev: NotificationItem[]) => NotificationItem[]
) => {
  notificationsState = updater(notificationsState);
  notifySubscribers();
};

const markAsReadImpl = (id: string) => {
  updateNotifications((prev) =>
    prev.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    )
  );
};

const markAllAsReadImpl = () => {
  updateNotifications((prev) =>
    prev.map((notification) =>
      notification.read ? notification : { ...notification, read: true }
    )
  );
};

const addNotificationImpl = (
  notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>
) => {
  updateNotifications((prev) => [
    {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    },
    ...prev,
  ]);
};

const removeNotificationImpl = (id: string) => {
  updateNotifications((prev) =>
    prev.filter((notification) => notification.id !== id)
  );
};

export const useNotifications = () => {
  const notifications = useSyncExternalStore(subscribe, getSnapshot);

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

  const markAsRead = useCallback((id: string) => {
    markAsReadImpl(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllAsReadImpl();
  }, []);

  const addNotification = useCallback(
    (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
      addNotificationImpl(notification);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    removeNotificationImpl(id);
  }, []);

  return {
    notifications: recentNotifications,
    allNotifications: sortedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
  };
};
