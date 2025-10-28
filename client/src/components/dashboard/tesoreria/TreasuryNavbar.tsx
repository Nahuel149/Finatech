import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useUserPermissions } from '../../../hooks';
import { DashboardBalanceWidget } from '../operaciones/DashboardBalanceWidget';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}

export const TreasuryNavbar: React.FC<Props> = ({ search, onSearchChange }) => {
  const { user, loading } = useCurrentUser();
  const { permissions } = useUserPermissions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canViewBalances = permissions.includes('view-balances');
  const displayName = user?.fullName?.trim() || (loading ? 'Cargando perfil…' : 'Usuario FinaTech');
  const secondaryText = user?.email || (loading ? 'Sincronizando…' : 'Sin correo configurado');

  return (
    <>
      {/* Mobile Header */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <i className="fa-solid fa-chart-line text-white text-sm" />
              </div>
              <span className="text-lg font-bold text-text-primary">FinaTech</span>
            </Link>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-text-primary hover:text-primary transition-colors mobile-button touch-friendly"
                aria-label="Buscar"
                onClick={() => {
                  const searchInput = document.getElementById('mobile-search-input');
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              >
                <i className="fa-solid fa-search text-lg" />
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  className="relative p-2 text-text-primary hover:text-primary transition-colors mobile-button touch-friendly"
                  aria-label="Notificaciones"
                >
                  <i className="fa-solid fa-bell text-lg" />
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-text-primary hover:text-primary transition-colors mobile-button touch-friendly"
                aria-label="Menú"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                alt="Usuario"
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{displayName}</div>
                <div className="text-xs text-gray-500">{secondaryText}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-search text-gray-400" />
                </div>
                <input
                  id="mobile-search-input"
                  type="text"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mobile-input touch-friendly"
                  placeholder="Buscar cliente u operación…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Link
                to="/dashboard"
                className="flex items-center px-4 py-3 text-text-primary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors mobile-button touch-friendly"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-exchange-alt mr-3 w-5" />
                Operaciones
              </Link>
              <div className="flex items-center px-4 py-3 text-primary bg-blue-50 rounded-lg font-medium">
                <i className="fa-solid fa-vault mr-3 w-5" />
                Tesorería
              </div>
              <Link
                to="/dashboard/logistica"
                className="flex items-center px-4 py-3 text-text-primary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors mobile-button touch-friendly"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fa-solid fa-truck mr-3 w-5" />
                Logística
              </Link>
              <div className="w-full flex items-center px-4 py-3 text-text-primary rounded-lg">
                <i className="fa-solid fa-calculator mr-3 w-5" />
                Liquidaciones
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mobile-button touch-friendly"
              >
                <i className="fa-solid fa-sign-out-alt mr-3 w-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navbar */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
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
                <span className="flex items-center px-3 py-2 text-text-primary cursor-default">
                  <i className="fa-solid fa-calculator mr-2" />
                  Liquidaciones
                </span>
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
              <DashboardBalanceWidget canView={canViewBalances} />
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
    </>
  );
};
