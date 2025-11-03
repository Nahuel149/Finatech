import React, { useMemo, useState } from 'react';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { DashboardFooter } from './Footer';
import { NotificationItem, useNotifications } from '../../../hooks';

const formatRelativeTime = (isoDate: string) => {
  const now = Date.now();
  const timestamp = new Date(isoDate).getTime();
  const diffMs = Math.max(now - timestamp, 0);
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hace 1 día';
  if (days < 7) return `Hace ${days} días`;
  return new Date(isoDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const levelBadgeClass = (level: NotificationItem['level']) => {
  switch (level) {
    case 'success':
      return 'bg-green-100 text-green-700';
    case 'warning':
      return 'bg-amber-100 text-amber-700';
    case 'error':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

export const NotificationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const {
    allNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading: notificationsLoading,
    error: notificationsError,
    refresh,
  } = useNotifications();

  const filteredNotifications = useMemo(() => {
    if (!search.trim()) {
      return allNotifications;
    }
    const term = search.trim().toLowerCase();
    return allNotifications.filter(
      (notification) =>
        notification.title.toLowerCase().includes(term) ||
        notification.description.toLowerCase().includes(term)
    );
  }, [allNotifications, search]);

  const unreadOnly = filteredNotifications.filter((notification) => !notification.read);
  const readNotifications = filteredNotifications.filter((notification) => notification.read);

  const renderNotificationCard = (notification: NotificationItem) => (
    <div
      key={notification.id}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors ${
        notification.read ? 'hover:border-gray-300' : 'border-primary/40 hover:border-primary'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelBadgeClass(
                notification.level
              )}`}
            >
              {notification.level === 'success' && 'Éxito'}
              {notification.level === 'warning' && 'Alerta'}
              {notification.level === 'error' && 'Error'}
              {notification.level === 'info' && 'Info'}
            </span>
            {!notification.read && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                No leída
              </span>
            )}
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-900">{notification.title}</h3>
          <p className="mt-2 text-sm text-gray-600">{notification.description}</p>
        </div>
        <span className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => markAsRead(notification.id).catch(() => {})}
          disabled={notification.read}
          className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            notification.read
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          Marcar como leída
        </button>
        {notification.actionLabel && (
          <button
            type="button"
            className="text-xs font-medium text-primary hover:text-blue-700"
          >
            {notification.actionLabel}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main
        id="notifications-content"
        className="px-4 pb-16 pt-[320px] lg:px-6 lg:pt-[145px]"
      >
        <header className="mb-8 flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Centro de notificaciones</h1>
            <p className="mt-1 text-sm text-gray-600">
              Revisá las novedades del sistema y marcá como leídas las que ya procesaste.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {unreadCount} pendientes
            </div>
            <button
              type="button"
              onClick={() => markAllAsRead().catch(() => {})}
              disabled={unreadCount === 0}
              className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:text-gray-400"
            >
              Marcar todas como leídas
            </button>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            No leídas
          </h2>
          {notificationsLoading && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Cargando notificaciones…
            </div>
          )}
          {notificationsError && !notificationsLoading && (
            <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
              No pudimos obtener las notificaciones.{' '}
              <button
                type="button"
                className="font-medium underline"
                onClick={() => refresh().catch(() => {})}
              >
                Reintentar
              </button>
            </div>
          )}
          <div className="mt-4 space-y-4">
            {unreadOnly.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                No tenés notificaciones pendientes.
              </div>
            ) : (
              unreadOnly.map(renderNotificationCard)
            )}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Historial
          </h2>
          <div className="mt-4 space-y-4">
            {readNotifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                Aún no hay notificaciones en el historial.
              </div>
            ) : (
              readNotifications.map(renderNotificationCard)
            )}
          </div>
        </section>
      </main>

      <DashboardFooter />
    </div>
  );
};
