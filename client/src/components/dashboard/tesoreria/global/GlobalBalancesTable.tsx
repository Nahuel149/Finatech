import React from 'react';
import { ApiError, TreasuryGlobalBalanceRow } from '../../../../types';
import { Alert } from '../../../ui';

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface Props {
  rows: TreasuryGlobalBalanceRow[];
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationInfo;
  sortValue: string;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onRowClick?: (row: TreasuryGlobalBalanceRow) => void;
  onViewDetail?: (row: TreasuryGlobalBalanceRow) => void;
}

const amountClass = (state: string) => {
  switch (state) {
    case 'positive':
      return 'positive-amount';
    case 'negative':
      return 'negative-amount';
    default:
      return 'neutral-amount';
  }
};

const variationMeta = (direction: string) => {
  switch (direction) {
    case 'up':
      return { icon: 'fa-arrow-up', className: 'text-success', prefix: '+' };
    case 'down':
      return { icon: 'fa-arrow-down', className: 'text-danger', prefix: '' };
    default:
      return { icon: 'fa-minus', className: 'text-neutral-amount', prefix: '' };
  }
};

const contactIcon = (type?: string | null) => {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'provider') return 'fa-handshake';
  if (normalized === 'general') return 'fa-chart-line';
  if (normalized === 'company' || normalized === 'empresa') return 'fa-building';
  return 'fa-user';
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-AR');
};

const buildPages = (current: number, total: number) => {
  const pages: number[] = [];
  const maxButtons = 5;

  if (total <= maxButtons) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
    return pages;
  }

  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxButtons - 1);

  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
};

export const GlobalBalancesTable: React.FC<Props> = ({
  rows,
  loading,
  error,
  pagination,
  sortValue,
  onSortChange,
  onPageChange,
  onRowClick,
  onViewDetail,
}) => {
  const { page, limit, totalItems, totalPages } = pagination;
  const hasRows = rows.length > 0;
  const startIndex = totalItems ? (page - 1) * limit + 1 : 0;
  const endIndex = totalItems ? Math.min(startIndex + limit - 1, totalItems) : 0;
  const pageButtons = buildPages(page, totalPages);

  return (
    <section id="main-table-section" className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Detalle de saldos</h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalItems
                ? `Mostrando ${startIndex}-${endIndex} de ${totalItems} registros`
                : 'Sin registros para los filtros seleccionados'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={sortValue}
                onChange={(event) => onSortChange(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="balance-desc">Saldo (mayor a menor)</option>
                <option value="balance-asc">Saldo (menor a mayor)</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="variation-desc">Variación (mayor a menor)</option>
                <option value="variation-asc">Variación (menor a mayor)</option>
                <option value="lastMovement-desc">Última operación (más reciente)</option>
                <option value="lastMovement-asc">Última operación (más antigua)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 border-b border-gray-200">
          <Alert type="error" title="No pudimos cargar los saldos" message={error.message || 'Intentalo nuevamente en unos minutos.'} />
        </div>
      )}

      <div className="overflow-x-auto">
        <table id="balance-table" className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cuenta / Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo Total
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variación %
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Última Operación
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody id="table-body" className="bg-white divide-y divide-gray-200">
            {loading &&
              [0, 1, 2, 3, 4].map((index) => (
                <tr key={`skeleton-row-${index}`} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full mr-3 animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-12 h-6 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mt-1" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse mx-auto" />
                  </td>
                </tr>
              ))}

            {!loading && hasRows &&
              rows.map((row) => {
                const variation = variationMeta(row.variation.direction);
                const variationValue = Number.isFinite(row.variation.percentage)
                  ? row.variation.percentage
                  : 0;
                return (
                  <tr
                    key={row.id}
                    className="table-row cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => onRowClick?.(row)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3 text-white">
                          <i className={`fa-solid ${contactIcon(row.contact?.contactType)}`} />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">
                            {row.contact?.fullName || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {row.contact?.contactType === 'provider'
                              ? 'Proveedor'
                              : row.contact?.contactType === 'client'
                              ? 'Cliente'
                              : 'General'}
                            {row.contact?.cuit ? ` • ${row.contact.cuit}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-semibold ${amountClass(row.balanceState)}`}>
                        {formatCurrency(row.amount, row.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`flex items-center justify-center ${variation.className}`}>
                        <i className={`fa-solid ${variation.icon} mr-1`} />
                        <span className="font-medium">
                          {variation.icon === 'fa-minus'
                            ? '0.0%'
                            : `${variationValue > 0 ? '+' : ''}${variationValue.toFixed(1)}%`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">
                        {formatDate(row.lastMovementAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastOperation?.code ? `#${row.lastOperation.code}` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewDetail?.(row);
                        }}
                        className="text-primary hover:text-blue-700 text-sm font-medium"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!loading && !hasRows && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No encontramos resultados con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="pagination" className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {totalItems
              ? `Mostrando ${startIndex}-${endIndex} de ${totalItems} registros`
              : 'Sin registros'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page <= 1}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            {pageButtons.map((pageNumber) => (
              <button
                key={`page-${pageNumber}`}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg ${
                  pageNumber === page
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50 transition-colors'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page >= totalPages}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
