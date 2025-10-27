import React from 'react';

interface Props {
  onRegisterMovement: () => void;
  onOpenConciliation: () => void;
  onOpenSettings: () => void;
}

export const TreasuryHeader: React.FC<Props> = ({
  onRegisterMovement,
  onOpenConciliation,
  onOpenSettings,
}) => (
  <section id="page-header" className="mb-8">
    <nav
      id="breadcrumbs"
      className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
      aria-label="Breadcrumb"
    >
      <span className="text-primary font-medium">Tesorería</span>
    </nav>

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Tesorería</h1>
        <p className="text-gray-600">
          Registro y control de movimientos de fondos en efectivo y transferencias
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="fa-solid fa-cog mr-2" />
          Configuración
        </button>
        <button
          type="button"
          onClick={onOpenConciliation}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="fa-solid fa-balance-scale mr-2" />
          Conciliar operaciones
        </button>
        <button
          type="button"
          onClick={onRegisterMovement}
          className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2" />
          Registrar movimiento
        </button>
      </div>
    </div>
  </section>
);
