import React, { useMemo } from 'react';
import { TreasuryMovement } from '../../../../types';

interface Props {
  movements: TreasuryMovement[];
  selectedMovementId: string | null;
  onSelect: (movement: TreasuryMovement) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

const formatAmount = (movement: TreasuryMovement) => {
  const currency = movement.currency || 'ARS';
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(movement.amount || 0));
};

const movementTypeBadge = (movement: TreasuryMovement) => {
  const direction = (movement.type || '').toLowerCase();
  if (direction === 'outgoing') {
    return {
      icon: 'fa-arrow-trend-down',
      badgeClass: 'bg-red-100',
      textClass: 'text-danger',
      label: 'Egreso',
    };
  }
  return {
    icon: 'fa-arrow-trend-up',
    badgeClass: 'bg-green-100',
    textClass: 'text-success',
    label: 'Ingreso',
  };
};

export const ReconciliationMovementsPanel: React.FC<Props> = ({
  movements,
  selectedMovementId,
  onSelect,
  filter,
  onFilterChange,
}) => {
  const filteredMovements = useMemo(() => {
    if (filter === 'ingreso') {
      return movements.filter((movement) => (movement.type || '').toLowerCase() === 'incoming');
    }
    if (filter === 'egreso') {
      return movements.filter((movement) => (movement.type || '').toLowerCase() === 'outgoing');
    }
    return movements;
  }, [movements, filter]);

  return (
    <div id="movements-panel" className="w-full min-h-0 bg-gray-50 border border-gray-200 lg:border-l lg:border-t-0 rounded-lg lg:rounded-none flex flex-col slide-in-right">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Movimientos disponibles</h3>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
        >
          <option value="">Mostrar todos</option>
          <option value="ingreso">Solo ingresos</option>
          <option value="egreso">Solo egresos</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMovements.length === 0 && (
          <div className="text-sm text-gray-500">No hay movimientos disponibles con el filtro seleccionado.</div>
        )}

        {filteredMovements.map((movement) => {
          const badge = movementTypeBadge(movement);
          const isSelected = selectedMovementId === movement.id;
          return (
            <button
              key={movement.id}
              type="button"
              className={`movement-card bg-white border-2 rounded-lg p-4 w-full text-left ${
                isSelected ? 'border-primary bg-blue-50 movement-card selected' : 'border-gray-200'
              }`}
              onClick={() => onSelect(movement)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${badge.badgeClass} rounded-lg flex items-center justify-center mr-3`}>
                    <i className={`fa-solid ${badge.icon} ${badge.textClass} text-sm`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{badge.label}</div>
                    <div className="text-xs text-gray-500">
                      {movement.medium ? movement.medium.charAt(0).toUpperCase() + movement.medium.slice(1) : '—'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={isSelected}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <div className={`text-lg font-bold ${badge.textClass}`}>{formatAmount(movement)}</div>
                <div className="text-xs text-gray-500">
                  {movement.movementAt
                    ? new Date(movement.movementAt).toLocaleString('es-AR')
                    : 'Sin fecha'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {(movement.status || '').charAt(0).toUpperCase() + (movement.status || '').slice(1)}
                </span>
                <div className="text-xs text-gray-500">{movement.movementCode || movement.id}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
