import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  search: string;
  onSearchChange: (q: string) => void;
}

export const DashboardNavbar: React.FC<Props> = ({ search, onSearchChange }) => (
  <nav id="navbar" className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo Section */}
        <div id="logo-section" className="flex items-center space-x-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <i className="fa-solid fa-chart-line text-white text-sm"></i>
            </div>
            <Link to="/dashboard" className="text-xl font-bold text-text-primary">FinaTech</Link>
          </div>

          {/* Main Navigation Menu */}
          <div id="main-nav" className="flex space-x-8">
            <span className="flex items-center px-3 py-2 text-primary font-medium border-b-2 border-primary cursor-pointer">
              <i className="fa-solid fa-exchange-alt mr-2"></i>
              Operaciones
            </span>
            <Link to="/dashboard/tesoreria" className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer">
              <i className="fa-solid fa-vault mr-2"></i>
              Tesorería
            </Link>
            <span className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer">
              <i className="fa-solid fa-truck mr-2"></i>
              Logística
            </span>
            <span className="flex items-center px-3 py-2 text-text-primary hover:text-primary transition-colors cursor-pointer">
              <i className="fa-solid fa-calculator mr-2"></i>
              Liquidaciones
            </span>
          </div>
        </div>

        {/* Center Search */}
        <div id="global-search" className="flex-1 max-w-md mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Buscar cliente u operación…"
            />
          </div>
        </div>

        {/* Right Section */}
        <div id="navbar-right" className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="relative p-2 text-text-primary hover:text-primary transition-colors">
              <i className="fa-solid fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>
          </div>

          {/* User Menu */}
          <div id="user-menu" className="relative">
            <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                alt="Usuario"
                className="w-8 h-8 rounded-full"
              />
              <div className="text-left">
                <div className="text-sm font-medium text-text-primary">Juan Pérez</div>
                <div className="text-xs text-gray-500">Operador Senior</div>
              </div>
              <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
);
