import React from 'react';
import { ArrowTopRightOnSquareIcon } from '../../icons/HeroiconsOutline';

export const TreasuryIntegrationSection: React.FC = () => {
  const handleTreasuryNavigation = () => {
    // Navigate to treasury module with logistics context
    window.location.href = '/dashboard/tesoreria?from=logistica';
  };

  return (
    <section className="mb-10">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Integración con Tesorería
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Visualizá el impacto financiero de las operaciones logísticas en los saldos y movimientos de tesorería.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Sincronización activa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Última actualización: hace 5 min</span>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            onClick={handleTreasuryNavigation}
          >
            <span>Ver en Tesorería</span>
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
