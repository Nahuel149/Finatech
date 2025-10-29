import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry, TreasuryMovement } from '../../../../types';

interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  activeBalanceId: string;
  onTabChange: (balanceId: string) => void;
  onViewMovement: (movement: TreasuryMovement) => void;
  onViewAll: (balanceId: string) => void;
}

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const typeBadge = (movement: TreasuryMovement) => {
  const isOutgoing = movement.type === 'outgoing';
  return {
    className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isOutgoing ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`,
    icon: isOutgoing ? 'fa-arrow-down' : 'fa-arrow-up',
    label: isOutgoing ? 'Egreso' : 'Ingreso',
  };
};

const mediumLabel = (medium?: string | null) => {
  switch (medium) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'deposit':
      return 'Depósito';
    default:
      return medium || '—';
  }
};

const statusBadge = (status?: string | null) => {
  switch (status) {
    case 'compensated':
      return { className: 'bg-green-100 text-green-800', label: 'Compensado' };
    case 'registered':
      return { className: 'bg-yellow-100 text-yellow-800', label: 'Registrado' };
    case 'cancelled':
      return { className: 'bg-red-100 text-red-800', label: 'Anulado' };
    default:
      return { className: 'bg-gray-100 text-gray-800', label: status || '—' };
  }
};

const formatAmount = (movement: TreasuryMovement) => {
  const currency = movement.currency || 'ARS';
  const value = movement.amount || 0;
  const absoluteAmount = Math.abs(value);
  const formatted = new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : 'es-AR',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }
  ).format(absoluteAmount);
  const sign = movement.type === 'outgoing' ? '-' : '';
  return `${sign}${formatted}`;
};

const MovementsSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {Array.from({ length: 7 }).map((_, index) => (
            <th
              key={`header-${index}`}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <tr key={`skeleton-row-${rowIndex}`}>
            {Array.from({ length: 7 }).map((__, colIndex) => (
              <td key={`skeleton-cell-${rowIndex}-${colIndex}`} className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
    <div className="text-sm text-gray-600">No hay movimientos recientes para esta cuenta.</div>
  </div>
);

export const LinkedBalancesMovementsSection: React.FC<Props> = ({
  balances,
  loading,
  activeBalanceId,
  onTabChange,
  onViewMovement,
  onViewAll,
}) => {
  const orderedBalances = balances.length
    ? balances
    : [];

  const activeBalance =
    orderedBalances.find((balance) => balance.id === activeBalanceId) || orderedBalances[0];

  return (
    <section id="recent-movements-section" className="mb-10 lg:mb-12">
      <h2 className="text-lg font-semibold text-text-primary mb-6 lg:mb-8">
        Movimientos recientes por cuenta
      </h2>

      <div id="movements-tabs" className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {orderedBalances.map((balance) => {
            const isActive = balance.id === (activeBalance?.id || activeBalanceId);
            return (
              <button
                key={balance.id}
                type="button"
                onClick={() => onTabChange(balance.id)}
                className={`pb-3 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-primary'
                }`}
              >
                {balance.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <MovementsSkeleton />}

      {!loading && activeBalance && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeBalance.recentMovements?.length ? (
                activeBalance.recentMovements.map((movement, index) => {
                  const badge = typeBadge(movement);
                  const status = statusBadge(movement.status);
                  const movementKey =
                    movement.id || movement.movementCode || movement.reference || `movement-${index}`;
                  return (
                    <tr key={movementKey}>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {formatDateTime(movement.movementAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={badge.className}>
                          <i className={`fa-solid ${badge.icon} mr-1`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {mediumLabel(movement.medium)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-medium ${
                          movement.type === 'outgoing' ? 'text-danger' : 'text-success'
                        }`}
                      >
                        {formatAmount(movement)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {movement.contact?.fullName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => onViewMovement(movement)}
                          className="text-primary hover:text-blue-700 text-sm"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onViewAll(activeBalance.id)}
              className="text-primary hover:text-blue-700 text-sm font-medium"
            >
              Ver todos los movimientos →
            </button>
          </div>
        </div>
      )}

      {!loading && !activeBalance && <EmptyState />}
    </section>
  );
};
