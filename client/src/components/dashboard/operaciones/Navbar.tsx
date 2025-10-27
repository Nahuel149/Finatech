import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  NotificationItem,
  NotificationLevel,
  useNotifications,
  useAuth,
  useUserPermissions,
} from '../../../hooks';
import { DashboardBalanceWidget } from './DashboardBalanceWidget';

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
  { label: 'Liquidaciones', path: null, icon: 'fa-calculator' },
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
  onMarkAllRead: () => void;
  className?: string;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onSeeAll,
  onMarkAllRead,
  className = '',
}) => (
  <div
    className={`absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50 ${className}`}
  >
    <div className="flex items-center justify-between px-4 py-3">
      <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-xs font-medium text-primary hover:text-blue-700"
        >
          Marcar todas como leídas
        </button>
      )}
    </div>
    <div className="max-h-80 overflow-y-auto">
      {notifications.length === 0 ? (
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const desktopNotificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { permissions, loading: permissionsLoading } = useUserPermissions();

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/dashboard/tesoreria')) return '/dashboard/tesoreria';
    if (location.pathname.startsWith('/dashboard')) return '/dashboard';
    return location.pathname;
  }, [location.pathname]);

  const normalizedPermissions = useMemo(
    () => permissions.map((perm) => perm.trim().toLowerCase().replace(/\s+/g, '-')),
    [permissions]
  );

  const canViewBalances = useMemo(
    () =>
      normalizedPermissions.some((permission) =>
        ['ver-saldos', 'view-saldos', 'view-balances'].includes(permission)
      ),
    [normalizedPermissions]
  );

  const showBalanceWidget = !permissionsLoading && canViewBalances;

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  }, [location.pathname]);

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
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

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50 lg:hidden">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2">
                <i className="fa-solid fa-chart-line text-white text-xs"></i>
              </div>
              <Link to="/dashboard" className="text-lg font-bold text-text-primary">
                FinaTech
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="p-2 text-text-primary hover:text-primary transition-colors"
                aria-label="Buscar"
              >
                <i className="fa-solid fa-search text-lg" />
              </button>
              <div ref={mobileNotificationsRef} className="relative">
                <button
                  type="button"
                  className="relative p-2 text-text-primary hover:text-primary transition-colors"
                  aria-label="Notificaciones"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((prev) => !prev)}
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
                    className="top-full"
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onNotificationClick={handleNotificationClick}
                    onSeeAll={handleSeeAllNotifications}
                    onMarkAllRead={markAllAsRead}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 text-text-primary hover:text-primary transition-colors"
                aria-label="Abrir menú"
              >
                <i className="fa-solid fa-bars text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`${mobileMenuOpen ? 'block' : 'hidden'} lg:hidden fixed top-[61px] left-0 right-0 bg-white border-b border-gray-200 z-40 shadow-sm`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
              alt="Usuario"
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">Juan Pérez</div>
              <div className="text-xs text-gray-500">Operador Senior</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 mb-4">
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard/perfil');
              }}
            >
              Perfil
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/dashboard/configuracion');
              }}
            >
              Configuración
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-danger/30 text-danger py-2 text-sm hover:bg-danger/10"
              onClick={handleLogout}
            >
              Salir
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-search text-gray-400 text-sm" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Buscar cliente u operación…"
              />
            </div>
          </div>

          <div className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path && activePath.startsWith(item.path);
              const commonClasses = 'flex items-center px-3 py-2 rounded-lg text-sm transition-colors';
              if (!item.path) {
                return (
                  <div key={item.label} className={`${commonClasses} text-text-primary`}>
                    <i className={`fa-solid ${item.icon} text-gray-500 mr-3`} />
                    <span>{item.label}</span>
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
                      ? ' bg-primary bg-opacity-10 text-primary font-medium'
                      : ' text-text-primary hover:text-primary hover:bg-primary hover:bg-opacity-10')
                  }
                >
                  <i className={`fa-solid ${item.icon} ${isActive ? 'text-primary' : 'text-gray-500'} mr-3`} />
                  <span>{item.label}</span>
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
            <div id="logo-section" className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-chart-line text-white text-sm" />
                </div>
                <Link to="/dashboard" className="text-xl font-bold text-text-primary">
                  FinaTech
                </Link>
              </div>

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

                  const isActive = activePath.startsWith(item.path);
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
            </div>

            <div id="global-search" className="flex-1 max-w-md mx-8">
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

            <div id="navbar-right" className="flex items-center space-x-4">
              {showBalanceWidget && (
                <div className="hidden lg:block">
                  <DashboardBalanceWidget canView={showBalanceWidget} />
                </div>
              )}
              <div ref={desktopNotificationsRef} className="relative">
                <button
                  type="button"
                  className="relative p-2 text-text-primary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                  aria-label="Notificaciones"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((prev) => !prev)}
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
                    <div className="text-sm font-medium text-text-primary">Juan Pérez</div>
                    <div className="text-xs text-gray-500">Operador Senior</div>
                  </div>
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">Juan Pérez</p>
                      <p className="text-xs text-gray-500">Operador Senior</p>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate('/dashboard/perfil');
                        }}
                      >
                        <i className="fa-solid fa-user-gear mr-3 text-gray-400" />
                        Perfil
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate('/dashboard/configuracion');
                        }}
                      >
                        <i className="fa-solid fa-sliders mr-3 text-gray-400" />
                        Configuración
                      </button>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket mr-3" />
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
