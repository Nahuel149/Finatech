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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Panel de Logística
          </h1>
          <p className="text-gray-600">
            Monitoreá el estado de las operaciones logísticas, entregas y movimientos pendientes
          </p>
        </div>
        
        <button
          id="register-action"
          type="button"
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleRegisterNewMovement}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Registrar nuevo movimiento logístico
        </button>
      </div>
    </header>
  );
};
