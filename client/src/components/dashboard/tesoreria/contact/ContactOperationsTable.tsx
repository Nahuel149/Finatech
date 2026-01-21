import React from 'react';
import { ApiError } from '../../../../types/auth';
import { TreasuryContactBalanceOperation } from '../../../../types/treasury';
import { Alert } from '../../../ui/Alert';

interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface Props {
  rows: TreasuryContactBalanceOperation[];
  currency: string;
  loading: boolean;
  error: ApiError | null;
  pagination: PaginationInfo;
  sortValue: string;
  onSortChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onViewOperation: (operation: TreasuryContactBalanceOperation) => void;
}

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const formattedDate = date.toLocaleDateString('es-AR');
  const formattedTime = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return { formattedDate, formattedTime };
};

const formatAmount = (amount: number, currency: string, direction: 'incoming' | 'outgoing') => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${direction === 'incoming' ? '+' : '-'}${formatted}`;
};

const listVisibilityStyle: React.CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '700px',
};

const statusClasses = (statusKey: string) => {
  switch (statusKey) {
    case 'registered':
      return 'bg-green-100 text-green-800';
    case 'settled':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const rowsSkeleton = Array.from({ length: 6 }, (_, index) => index);

const buildPageNumbers = (current: number, total: number) => {
  const pages: number[] = [];
  const windowSize = 5;
  if (total <= windowSize) {
    for (let i = 1; i <= total; i += 1) pages.push(i);
    return pages;
  }
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
};

export const ContactOperationsTable: React.FC<Props> = ({
  rows,
  currency,
  loading,
  error,
  pagination,
  sortValue,
  onSortChange,
  onPageChange,
  onViewOperation,
}) => {
  const pageNumbers = buildPageNumbers(pagination.page, pagination.totalPages);
  const hasRows = rows.length > 0;
  const startIndex = pagination.totalItems ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endIndex = pagination.totalItems
    ? Math.min(startIndex + pagination.limit - 1, pagination.totalItems)
    : 0;

  return (
    <section
      id="operations-table-section"
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Historial de operaciones</h2>
            <p className="text-sm text-gray-600 mt-1">
              {pagination.totalItems
                ? `Mostrando ${startIndex}-${endIndex} de ${pagination.totalItems} operaciones`
                : 'Sin operaciones para los filtros seleccionados'}
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
                <option value="date-desc">Fecha (más reciente)</option>
                <option value="date-asc">Fecha (más antigua)</option>
                <option value="amount-desc">Monto (mayor a menor)</option>
                <option value="amount-asc">Monto (menor a mayor)</option>
                <option value="type-asc">Tipo (A-Z)</option>
                <option value="type-desc">Tipo (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 border-b border-gray-200">
          <Alert type="error" title="No pudimos cargar las operaciones" message={error.message || 'Intentalo nuevamente más tarde.'} />
        </div>
      )}

      <div className="overflow-x-auto" style={listVisibilityStyle}>
        <table id="operations-table" className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha y Hora
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de Operación
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Moneda
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Operación
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody id="table-body" className="bg-white divide-y divide-gray-200">
            {loading &&
              rowsSkeleton.map((index) => (
                <tr key={`skeleton-${index}`} className="table-row">
                  <td className="px-6 py-4">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-100 rounded mt-2 animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block h-6 w-12 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mx-auto" />
                  </td>
                </tr>
              ))}

            {!loading && hasRows &&
              rows.map((row) => {
                const datetime = formatDate(row.createdAt);
                const amountClass =
                  row.direction === 'incoming' ? 'text-green-600' : 'text-red-600';
                const rowCurrency = row.currency || currency;
                return (
                  <tr key={row.id ?? `${row.createdAt}-${row.operation.code ?? ''}`} className="table-row">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">
                        {typeof datetime === 'string' ? datetime : datetime.formattedDate}
                      </div>
                      <div className="text-xs text-gray-500">{typeof datetime === 'string' ? '' : datetime.formattedTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-text-primary">
                        <i
                          className={`fa-solid ${
                            row.direction === 'incoming' ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'
                          } mr-2`}
                        />
                        <span>{row.operation.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rowCurrency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-semibold ${amountClass}`}>
                        {formatAmount(row.amount, rowCurrency, row.direction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses(
                          row.status.key
                        )}`}
                      >
                        {row.status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-mono text-primary">
                        {row.operation.code ? `#${row.operation.code}` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onViewOperation(row)}
                        className="text-primary hover:text-blue-700 text-sm font-medium"
                      >
                        Ver operación
                      </button>
                    </td>
                  </tr>
                );
              })}

            {!loading && !hasRows && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron operaciones para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="pagination" className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {pagination.totalItems
              ? `Mostrando ${startIndex}-${endIndex} de ${pagination.totalItems} operaciones`
              : 'Sin operaciones'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page <= 1}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={`page-${pageNumber}`}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg ${
                  pageNumber === pagination.page
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50 transition-colors'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={pagination.page >= pagination.totalPages}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
