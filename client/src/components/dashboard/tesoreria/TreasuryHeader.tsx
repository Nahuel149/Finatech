import React from 'react';
import { Button } from '../../shared/design-system';

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
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Tesorería</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Registro y control de movimientos de fondos en efectivo y transferencias
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-3 sm:gap-0">
        <Button
          variant="outline"
          size="md"
          onClick={onOpenSettings}
          icon="fa-solid fa-cog"
          className="mobile-button touch-friendly"
        >
          <span className="hidden sm:inline">Configuración</span>
          <span className="sm:hidden">Config.</span>
        </Button>
        <Button
          variant="outline"
          size="md"
          onClick={onOpenConciliation}
          icon="fa-solid fa-balance-scale"
          className="mobile-button touch-friendly"
        >
          <span className="hidden sm:inline">Conciliar operaciones</span>
          <span className="sm:hidden">Conciliar</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onRegisterMovement}
          icon="fa-solid fa-plus"
          className="mobile-button touch-friendly font-medium"
        >
          <span className="hidden sm:inline">Registrar movimiento</span>
          <span className="sm:hidden">Registrar</span>
        </Button>
      </div>
    </div>
  </section>
);
