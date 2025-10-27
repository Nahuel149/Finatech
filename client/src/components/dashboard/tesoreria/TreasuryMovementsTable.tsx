import React from 'react';
import {
  ApiError,
  TreasuryMovement,
  TreasuryMovementsTotals,
} from '../../../types';
import {
  TreasuryMovementsSortOption,
} from '../../../hooks';

interface Props {
  items: TreasuryMovement[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  sort: TreasuryMovementsSortOption;
  onSortChange: (sort: TreasuryMovementsSortOption) => void;
  totals: Record<string, TreasuryMovementsTotals>;
  onViewDetail: (movement: TreasuryMovement) => void;
  onView: (movement: TreasuryMovement) => void;
  onEdit: (movement: TreasuryMovement) => void;
  onCancel: (movement: TreasuryMovement) => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return { date: '—', time: '' };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' };
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}:${seconds}`,
  };
};

const amountClass = (movement: TreasuryMovement) =>
  movement.type === 'outgoing' ? 'negative-amount' : 'positive-amount';

const formatAmount = (movement: TreasuryMovement) => {
  const currency = movement.currency || 'ARS';
  const value = movement.amount || 0;
  const amount = Math.abs(value);
  const formatted = new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : 'es-AR',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }
  ).format(amount);
  const sign = movement.type === 'outgoing' ? '-' : '';
  return `${sign}${formatted}`;
};

const typeIcon = (type: string) =>
  type === 'outgoing' ? 'fa-arrow-up text-danger' : 'fa-arrow-down text-success';

const typeLabel = (type: string) => (type === 'outgoing' ? 'Egreso' : 'Ingreso');

const mediumLabel = (medium: string) => {
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

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'compensated':
      return 'bg-green-100 text-green-800';
    case 'registered':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'compensated':
      return 'Compensado';
    case 'registered':
      return 'Registrado';
    case 'cancelled':
      return 'Anulado';
    default:
      return status;
  }
};

const currencyBadgeClass = (currency: string) =>
  currency === 'USD'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-800';

const totalsSummary = (totals: Record<string, TreasuryMovementsTotals>) => {
  const entries = Object.entries(totals);
  if (!entries.length) return null;

  return {
    incoming: entries
      .map(
        ([currency, total]) =>
          `${currency === 'USD' ? 'USD ' : '$'}${Math.abs(total.incoming).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
      )
      .join(' + '),
    outgoing: entries
      .map(
        ([currency, total]) =>
          `${currency === 'USD' ? 'USD ' : '$'}${Math.abs(total.outgoing).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
      )
      .join(' + '),
    net: entries
      .map(([currency, total]) => {
        const sign = total.net >= 0 ? '' : '-';
        return `${sign}${currency === 'USD' ? 'USD ' : '$'}${Math.abs(total.net).toLocaleString(
          'es-AR',
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;
      })
      .join(' + '),
  };
};

const movementCode = (movement: TreasuryMovement) =>
  movement.movementCode || movement.id || '—';

const linkedOperationCode = (movement: TreasuryMovement) => {
  const operation = movement.linkedOperations?.[0];
  return operation?.code ? `#${operation.code}` : '—';
};

export const TreasuryMovementsTable: React.FC<Props> = ({
  items,
  loading,
  error,
  onRetry,
  pagination,
  onPageChange,
  sort,
  onSortChange,
  totals,
  onViewDetail,
  onView,
  onEdit,
  onCancel,
}) => {
  const from = Math.max(0, (pagination.page - 1) * pagination.limit) + (items.length ? 1 : 0);
  const to = Math.min(pagination.page * pagination.limit, pagination.totalItems);
  const summary = totalsSummary(totals);

  const maxPageButtons = 5;
  const totalPages = Math.max(1, pagination.totalPages);
  const startPage = Math.max(
    1,
    Math.min(
      pagination.page - Math.floor(maxPageButtons / 2),
      totalPages - maxPageButtons + 1
    )
  );
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  const pageNumbers = [];
  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    pageNumbers.push(pageNumber);
  }

  const renderSkeletonRow = (key: number) => (
    <tr key={`skeleton-${key}`} className="table-row">
      {Array.from({ length: 9 }).map((_, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );

  return (
    <section
      id="movements-table-section"
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Movimientos de tesorería</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando {from || 0}-{to || 0} de {pagination.totalItems} movimientos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as TreasuryMovementsSortOption)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="date-desc">Fecha (más reciente)</option>
              <option value="date-asc">Fecha (más antigua)</option>
              <option value="amount-desc">Monto (mayor a menor)</option>
              <option value="amount-asc">Monto (menor a mayor)</option>
              <option value="status">Estado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table id="movements-table" className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha y Hora
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medio
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operación
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody id="table-body" className="bg-white divide-y divide-gray-200">
            {loading && Array.from({ length: 5 }).map((_, index) => renderSkeletonRow(index))}

            {!loading &&
              !error &&
              items.map((movement) => {
                const dateInfo = formatDate(movement.movementAt);
                const isCancelled = movement.status === 'cancelled';
                const statusCls = statusBadgeClass(movement.status);

                return (
                  <tr
                    key={movementCode(movement)}
                    className="table-row cursor-pointer fade-in"
                    onClick={() => onViewDetail(movement)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{dateInfo.date}</div>
                      <div className="text-xs text-gray-500">{dateInfo.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <i className={`fa-solid ${typeIcon(movement.type)} mr-2`} />
                        <span className="text-sm text-text-primary">{typeLabel(movement.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-text-primary">{mediumLabel(movement.medium)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currencyBadgeClass(
                          movement.currency
                        )}`}
                      >
                        {movement.currency || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-semibold ${amountClass(movement)}`}>
                        {formatAmount(movement)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-primary">
                        {movement.contact?.fullName || movement.contact?.shortName || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-mono text-primary">{linkedOperationCode(movement)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
                        {statusLabel(movement.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onView(movement);
                          }}
                          className="text-primary hover:text-blue-700 text-sm"
                          aria-label="Ver movimiento"
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!isCancelled) {
                              onEdit(movement);
                            }
                          }}
                          className={`text-sm ${isCancelled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                          aria-label="Editar movimiento"
                          disabled={isCancelled}
                        >
                          <i className="fa-solid fa-edit" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!isCancelled) {
                              onCancel(movement);
                            }
                          }}
                          className={`text-sm ${isCancelled ? 'text-gray-400 cursor-not-allowed' : 'text-danger hover:text-red-700'}`}
                          aria-label="Anular movimiento"
                          disabled={isCancelled}
                        >
                          <i className="fa-solid fa-ban" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && !error && !items.length && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={9}>
                  No se encontraron movimientos con los filtros aplicados.
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-red-600" colSpan={9}>
                  <div className="flex flex-col items-center space-y-3">
                    <span>{error.message || 'Error al cargar los movimientos.'}</span>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="pagination" className="px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-sm text-gray-600">
            Mostrando {from || 0}-{to || 0} de {pagination.totalItems} movimientos
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page <= 1}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pageNumber === pagination.page
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page >= pagination.totalPages}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div id="totals-section" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total ingresos</div>
              <div className="text-2xl font-bold positive-amount">{summary.incoming}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total egresos</div>
              <div className="text-2xl font-bold negative-amount">{summary.outgoing}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Balance neto</div>
              <div className={`text-2xl font-bold ${summary.net.startsWith('-') ? 'negative-amount' : 'positive-amount'}`}>
                {summary.net}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
