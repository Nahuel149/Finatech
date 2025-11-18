import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

const PUBLIC_PATH_PREFIXES = ['/', '/login', '/register', '/recover', '/verify-email'];

const SessionTimeoutManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isPublicRoute = PUBLIC_PATH_PREFIXES.some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  const handleTimeout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('finatech_idle_logout', '1');
    }

    try {
      await logout();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Error al cerrar sesión tras inactividad', error);
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  useInactivityLogout(handleTimeout, { enabled: !isPublicRoute });

  return null;
};

export default SessionTimeoutManager;
