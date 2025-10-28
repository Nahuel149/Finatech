import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../../hooks';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}

export const TreasuryNavbar: React.FC<Props> = ({ search, onSearchChange }) => {
  const { user, loading } = useCurrentUser();
  const displayName = user?.fullName?.trim() || (loading ? 'Cargando perfil…' : 'Usuario FinaTech');
  const secondaryText = user?.email || (loading ? 'Sincronizando…' : 'Sin correo configurado');

  return (
  <nav
    id="navbar"
    className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50"
  >
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div id="logo-section" className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <i className="fa-solid fa-chart-line text-white text-sm" />
            </div>
            <span className="text-xl font-bold text-text-primary">FinaTech</span>
          </Link>

          <div id="main-nav" className="flex space-x-8">
            <Link
              to="/dashboard"
              className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-exchange-alt mr-2" />
              Operaciones
            </Link>
            <span className="flex items-center px-3 py-2 text-primary bg-blue-50 rounded-lg font-medium transition-colors cursor-default">
              <i className="fa-solid fa-vault mr-2" />
              Tesorería
            </span>
            <Link
              to="/dashboard/logistica"
              className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-truck mr-2" />
              Logística
            </Link>
            <button
              type="button"
              className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-calculator mr-2" />
              Liquidaciones
            </button>
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
          <div className="relative">
            <button
              type="button"
              className="relative p-2 text-text-primary hover:text-primary transition-colors"
              aria-label="Notificaciones"
            >
              <i className="fa-solid fa-bell text-lg" />
              <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          <div id="user-menu" className="relative">
            <button
              type="button"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
          </div>
        </div>
      </div>
    </div>
  </nav>
  );
};
