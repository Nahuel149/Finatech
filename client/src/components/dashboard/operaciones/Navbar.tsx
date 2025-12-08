import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  NotificationItem,
  NotificationLevel,
  useNotifications,
  useAuth,
  useCurrentUser,
} from '../../../hooks';
import { ApiError } from '../../../types';

interface Props {
  search: string;
  onSearchChange: (q: string) => void;
}

interface NavItem {
  label: string;
  path: string | null;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Operaciones', path: '/dashboard', icon: 'fa-exchange-alt' },
  { label: 'Tesorería', path: '/dashboard/tesoreria', icon: 'fa-vault' },
  { label: 'Logística', path: '/dashboard/logistica', icon: 'fa-truck' },
];

const notificationLevelColor: Record<NotificationLevel, string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

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

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationClick: (notification: NotificationItem) => void;
  onSeeAll: () => void;
  onMarkAllRead: () => Promise<void> | void;
  className?: string;
  loading?: boolean;
  error?: ApiError | null;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onSeeAll,
  onMarkAllRead,
  className = '',
  loading = false,
  error = null,
}) => (
  <div
    className={`absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50 ${className}`}
  >
    <div className="flex items-center justify-between px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => {
            const result = onMarkAllRead();
            if (result && typeof (result as Promise<void>).catch === 'function') {
              (result as Promise<void>).catch(() => {});
            }
          }}
          className="text-xs font-medium text-primary hover:text-blue-700"
        >
          Marcar todas como leídas
        </button>
      )}
    </div>
    <div className="max-h-80 overflow-y-auto">
      {loading ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          Cargando notificaciones…
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-sm text-danger">
          No pudimos cargar las notificaciones.
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No tenés notificaciones pendientes.
        </div>
      ) : (
        notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => onNotificationClick(notification)}
            className={`w-full text-left px-4 py-3 transition-colors ${
              notification.read ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className="flex items-start space-x-3">
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  notification.read
                    ? 'bg-gray-300'
                    : notificationLevelColor[notification.level]
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.description}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
    <div className="border-t border-gray-200 px-4 py-3">
      <button
        type="button"
        onClick={onSeeAll}
        className="text-sm font-medium text-primary hover:text-blue-700"
      >
        Ver todas
      </button>
    </div>
  </div>
);

export const DashboardNavbar: React.FC<Props> = ({ search, onSearchChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const desktopNotificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { user, loading: userLoading } = useCurrentUser();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications();
  const displayName = user?.fullName?.trim() || (userLoading ? 'Cargando perfil…' : 'Usuario FinaTech');
  const secondaryText = user?.email || (userLoading ? 'Sincronizando…' : 'Sin correo configurado');

  const activePath = useMemo(() => {
    const normalizedPath = location.pathname.startsWith('/dashboard/tesoreria/saldos')
      ? '/dashboard'
      : location.pathname;

    const candidates = NAV_ITEMS.filter((item): item is NavItem & { path: string } => Boolean(item.path))
      .sort((a, b) => (b.path!.length - a.path!.length));
    const matched = candidates.find((item) =>
      normalizedPath.startsWith(item.path)
    );
    return matched?.path ?? normalizedPath;
  }, [location.pathname]);

  const handleNavigate = () => {
    setMobileMenuOpen(false);
  };

  const formatBadgeValue = (value: number) => (value > 9 ? '9+' : value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const notificationContainers = [
        desktopNotificationsRef.current,
        mobileNotificationsRef.current,
      ];
      const isInsideNotifications = notificationContainers.some(
        (container) => container && container.contains(target)
      );
      if (!isInsideNotifications) {
        setNotificationsOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        !(mobileMenuButtonRef.current && mobileMenuButtonRef.current.contains(target))
      ) {
        setMobileMenuOpen(false);
        setMobileProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setNotificationsOpen(false);
    setAccountMenuOpen(false);
    setMobileProfileOpen(false);
  }, [location.pathname]);

  const handleOpenNotifications = () => {
    setNotificationsOpen((prev) => !prev);
    if (!notificationsOpen) {
      setMobileMenuOpen(false);
      setMobileProfileOpen(false);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id).catch(() => {});
    setNotificationsOpen(false);
  };

  const handleSeeAllNotifications = () => {
    setNotificationsOpen(false);
    navigate('/dashboard/notificaciones', { replace: false });
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const openSearchOnMobile = () => {
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
      // Focus the input shortly after opening the menu
      setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
    } else {
      // If already open, just focus
      mobileSearchInputRef.current?.focus();
    }
  };

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50 lg:hidden">
        <div className="px-4 py-3">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <i className="fa-solid fa-chart-line text-white text-sm"></i>
              </div>
              <Link to="/dashboard" className="text-xl font-bold text-text-primary">
                FinaTech
              </Link>
            </div>

            <div className="flex items-center justify-end space-x-1.5">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center text-text-primary hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Buscar"
                onClick={openSearchOnMobile}
              >
                <i className="fa-solid fa-search text-lg" />
              </button>
              <div ref={mobileNotificationsRef} className="relative">
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center text-text-primary hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                  aria-label="Notificaciones"
                  aria-expanded={notificationsOpen}
                  onClick={handleOpenNotifications}
                >
                  <i className="fa-solid fa-bell text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {formatBadgeValue(unreadCount)}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <NotificationsDropdown
                    className="top-full right-0 w-72"
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onSeeAll={handleSeeAllNotifications}
                    onMarkAllRead={() => markAllAsRead().catch(() => {})}
                    loading={notificationsLoading}
                    error={notificationsError}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center text-text-primary hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                ref={mobileMenuButtonRef}
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden fixed top-[65px] left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-lg max-h-[calc(100vh-65px)] overflow-y-auto`}
        ref={mobileMenuRef}
      >
        <div className="px-4 py-4">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setMobileProfileOpen((prev) => !prev)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <img
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                  alt="Usuario"
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="text-left">
                  <div className="text-base font-medium text-text-primary">{displayName}</div>
                  <div className="text-sm text-gray-500">{secondaryText}</div>
                </div>
              </div>
              <i
                className={`fa-solid fa-chevron-down text-gray-400 transition-transform duration-200 ${
                  mobileProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {mobileProfileOpen && (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed"
                  disabled
                  aria-disabled="true"
                >
                  <i className="fa-solid fa-user-gear mr-2" />
                  Perfil
                </button>
                <button
                  type="button"
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed"
                  disabled
                  aria-disabled="true"
                >
                  <i className="fa-solid fa-sliders mr-2" />
                  Configuración
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-2 text-sm text-danger border border-danger/30 rounded-lg hover:bg-danger/10"
                  onClick={handleLogout}
                >
                  <i className="fa-solid fa-right-from-bracket mr-2" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-search text-gray-400 text-sm" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50"
                placeholder="Buscar operaciones, clientes..."
                ref={mobileSearchInputRef}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3">
              Navegación
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === activePath;
              const commonClasses = 'flex items-center px-4 py-3 rounded-lg text-sm transition-colors';
              if (!item.path) {
                return (
                  <div key={item.label} className={`${commonClasses} text-gray-400 bg-gray-50 border border-gray-200`}>
                    <i className={`fa-solid ${item.icon} text-gray-400 mr-4 text-base opacity-50`} />
                    <span className="flex-1">{item.label}</span>
                    <i className="fa-solid fa-lock text-xs" />
                  </div>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavigate}
                  className={
                    commonClasses +
                    (isActive
                      ? ' bg-primary/10 text-primary font-medium border border-primary/20'
                      : ' text-text-primary hover:text-primary hover:bg-primary/5 border border-gray-200')
                  }
                >
                  <i className={`fa-solid ${item.icon} ${isActive ? 'text-primary' : 'text-gray-500'} mr-4 text-base`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <i className="fa-solid fa-chevron-right text-xs text-primary" />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop navbar */}
      <nav
        id="navbar"
        className="hidden lg:block fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div id="logo-section" className="flex items-center space-x-8 flex-1 min-w-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-chart-line text-white text-sm" />
                </div>
                <Link to="/dashboard" className="text-xl font-bold text-text-primary">
                  FinaTech
                </Link>
              </div>

              <div className="flex items-center space-x-8 flex-1 min-w-0">
                <div id="main-nav" className="flex space-x-8">
                  {NAV_ITEMS.map((item) => {
                    if (!item.path) {
                      return (
                        <span
                          key={item.label}
                          className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          <i className={`fa-solid ${item.icon} mr-2`} />
                          {item.label}
                        </span>
                      );
                    }

                    const isActive = item.path === activePath;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-3 py-2 transition-colors cursor-pointer ${
                          isActive
                            ? 'text-primary font-medium border-b-2 border-primary'
                            : 'text-text-primary hover:text-primary'
                        }`}
                      >
                        <i className={`fa-solid ${item.icon} mr-2`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div id="global-search" className="flex-1 max-w-md">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-search text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => onSearchChange(event.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Buscar cliente u operación…"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div id="navbar-right" className="flex items-center space-x-4">
              <div ref={desktopNotificationsRef} className="relative">
                <button
                  type="button"
                  className="relative p-2 text-text-primary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                  aria-label="Notificaciones"
                  aria-expanded={notificationsOpen}
                onClick={handleOpenNotifications}
                >
                  <i className="fa-solid fa-bell text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {formatBadgeValue(unreadCount)}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <NotificationsDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onSeeAll={handleSeeAllNotifications}
                    onMarkAllRead={markAllAsRead}
                    loading={notificationsLoading}
                    error={notificationsError}
                  />
                )}
              </div>
              <div id="user-menu" className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                >
                  <img
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                    alt="Usuario"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <div className="text-sm font-medium text-text-primary">{displayName}</div>
                    <div className="text-xs text-gray-500">{secondaryText}</div>
                  </div>
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">{secondaryText}</p>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                        aria-disabled="true"
                      >
                        <i className="fa-solid fa-user-gear mr-3 text-gray-400" />
                        Perfil
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        disabled
                        aria-disabled="true"
                      >
                        <i className="fa-solid fa-sliders mr-3 text-gray-400" />
                        Configuración
                      </button>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-danger hover:bg-gray-100"
                        onClick={handleLogout}
                      >
                        <i className="fa-solid fa-right-from-bracket mr-3" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
