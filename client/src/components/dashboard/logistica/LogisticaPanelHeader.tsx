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
    <header className="mb-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/dashboard" className="hover:text-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <ChevronRightIcon className="h-4 w-4" />
          </li>
          <li>
            <span className="text-primary font-medium cursor-pointer">Logística</span>
          </li>
        </ol>
      </nav>

      {/* Header Content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary mb-2 sm:text-2xl">
            Panel de Logística
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Monitoreá el estado de las operaciones logísticas, entregas y movimientos pendientes.
          </p>
        </div>
        
        <button
          id="register-action"
          type="button"
          className="order-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 lg:order-none lg:text-base"
          onClick={handleRegisterNewMovement}
        >
          <PlusIcon className="h-4 w-4" />
          Registrar nuevo movimiento logístico
        </button>
      </div>
    </header>
  );
};
