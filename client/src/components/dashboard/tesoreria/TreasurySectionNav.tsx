import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserPermissions } from '../../../hooks/useUserPermissions';

interface NavItem {
  key: 'movimientos' | 'saldos' | 'saldos-vinculados' | 'recepciones';
  label: string;
  path: string;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'movimientos', label: 'Movimientos', path: '/dashboard/tesoreria' },
  { key: 'saldos', label: 'Saldos globales', path: '/dashboard/tesoreria/saldos' },
  {
    key: 'saldos-vinculados',
    label: 'Saldos vinculados',
    path: '/dashboard/tesoreria/saldos/vinculados',
  },
  {
    key: 'recepciones',
    label: 'Recepciones pendientes',
    path: '/dashboard/tesoreria/recepciones',
    permission: 'treasury:receptions',
  },
];

interface Props {
  active?: NavItem['key'];
  className?: string;
}

export const TreasurySectionNav: React.FC<Props> = ({ active, className = '' }) => {
  const location = useLocation();
  const { permissions } = useUserPermissions();

  const visibleItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => !item.permission || permissions.includes(item.permission));
  }, [permissions]);

  const computedActive = useMemo(() => {
    if (active) {
      return active;
    }
    const match = visibleItems.find((item) => location.pathname.startsWith(item.path));
    return match?.key ?? 'movimientos';
  }, [active, location.pathname, visibleItems]);

  return (
    <nav className={`flex flex-wrap gap-3 ${className}`} aria-label="Secciones de Tesorería">
      {visibleItems.map((item) => {
        const isActive = item.key === computedActive;
        return (
          <Link
            key={item.key}
            to={item.path}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              isActive
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
