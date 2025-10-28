import React from 'react';
import { ChevronRightIcon, PlusIcon } from '../../icons/HeroiconsOutline';

interface LogisticaPanelHeaderProps {
  onRegisterClick?: () => void;
}

export const LogisticaPanelHeader: React.FC<LogisticaPanelHeaderProps> = ({ onRegisterClick }) => {
  const handleRegisterNewMovement = () => {
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      // Fallback to navigation if no handler provided
      window.location.href = '/dashboard/logistica/registrar-nuevo-movimiento';
    }
  };

  return (
    <header className="mb-8 mt-20">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
        <span className="text-primary font-medium cursor-pointer">Logística</span>
        <ChevronRightIcon className="h-3 w-3 text-gray-400" />
        <span>Panel principal</span>
      </nav>

      {/* Title and Description */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
            Panel de Logística
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Monitoreá el estado de las operaciones logísticas, entregas y movimientos pendientes
          </p>
        </div>
        
        <button
          id="register-action"
          type="button"
          className="mobile-button touch-friendly flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full lg:w-auto"
          onClick={handleRegisterNewMovement}
        >
          <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="sm:hidden">Registrar movimiento</span>
          <span className="hidden sm:inline">Registrar nuevo movimiento logístico</span>
        </button>
      </div>
    </header>
  );
};
