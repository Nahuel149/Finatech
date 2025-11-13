import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/design-system';
import { useUserPermissions } from '../../../hooks';

interface Props {
  onRegisterMovement: () => void;
  onOpenConciliation: () => void;
  onOpenSettings: () => void;
}

export const TreasuryHeader: React.FC<Props> = ({
  onRegisterMovement,
  onOpenConciliation,
  onOpenSettings,
}) => {
  const { permissions, loading } = useUserPermissions();
  const canManageTreasury = permissions.includes('manage-treasury');
  const canViewReceptions = permissions.includes('treasury:receptions');

  return (
    <section id="page-header" className="mb-8 pt-44 lg:pt-0">
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
          <Link
            to="/dashboard/tesoreria/recepciones"
            className="w-full sm:w-auto"
          >
            <Button
              variant="ghost"
              size="md"
              className="w-full sm:w-auto text-sm sm:text-base"
              icon="fa-solid fa-inbox"
              disabled={loading || !canViewReceptions}
              title={!canViewReceptions ? 'Necesitás permiso de Tesorería para ver recepciones.' : undefined}
            >
              Recepciones pendientes
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={onOpenSettings}
            icon="fa-solid fa-cog"
            className="hidden sm:inline-flex"
          >
            Configuración
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onOpenConciliation}
            icon="fa-solid fa-balance-scale"
            className="w-full sm:w-auto text-sm sm:text-base"
            disabled={loading || !canManageTreasury}
            title={
              !canManageTreasury
                ? 'Necesitás permiso de Tesorería para conciliar operaciones.'
                : undefined
            }
          >
            Conciliar operaciones
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onRegisterMovement}
            icon="fa-solid fa-plus"
            className="w-full sm:w-auto text-sm sm:text-base font-medium"
            disabled={loading || !canManageTreasury}
            title={
              !canManageTreasury
                ? 'Necesitás permiso de Tesorería para registrar movimientos.'
                : undefined
            }
          >
            Registrar movimiento
          </Button>
        </div>
      </div>
    </section>
  );
};
