import React from 'react';
import { OperationSuggestion } from '../../../../types';

interface Props {
  operations: OperationSuggestion[];
  selectedIds: string[];
  onToggle: (operationId: string) => void;
  loading: boolean;
  error: string | null;
}

const operationTypeBadge = (operation: OperationSuggestion) => {
  const value = (operation.movementType || '').toLowerCase();
  if (value.includes('buy') || value.includes('compra')) {
    return { label: 'Compra', className: 'bg-green-100 text-green-800' };
  }
  if (value.includes('sell') || value.includes('venta')) {
    return { label: 'Venta', className: 'bg-yellow-100 text-yellow-800' };
  }
  if (value.includes('transfer')) {
    return { label: 'Transferencia ARS', className: 'bg-purple-100 text-purple-800' };
  }
  return { label: 'Operación', className: 'bg-blue-100 text-blue-800' };
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ReconciliationOperationsTable: React.FC<Props> = ({
  operations,
  selectedIds,
  onToggle,
  loading,
  error,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="lg:hidden p-4 border-b border-gray-100 space-y-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Sel. · Fecha · Tipo · Contacto · Moneda · Monto · Operación · Estado
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-500">
            <span className="inline-flex items-center">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Buscando coincidencias…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && !operations.length && (
          <div className="text-center text-sm text-gray-500">
            No se encontraron operaciones para conciliar con el movimiento seleccionado.
          </div>
        )}

        {!loading &&
          !error &&
          operations.map((operation) => {
            const badge = operationTypeBadge(operation);
            const isSelected = selectedIds.includes(operation.id);
            const amount = new Intl.NumberFormat(
              operation.currency === 'USD' ? 'en-US' : 'es-AR',
              { style: 'currency', currency: operation.currency }
            ).format(operation.amount);

            return (
              <button
                key={operation.id}
                type="button"
                onClick={() => onToggle(operation.id)}
                className={`w-full text-left border-2 rounded-xl p-4 bg-white shadow-sm transition-colors ${
                  isSelected ? 'border-primary bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500">{formatDate(operation.confirmedAt)}</div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={isSelected}
                    onChange={(event) => {
                      event.stopPropagation();
                      onToggle(operation.id);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {operation.currency}
                  </span>
                </div>

                <div className="text-lg font-semibold text-text-primary mb-1">{amount}</div>
                <div className="text-sm text-gray-600 mb-2">{operation.description || '—'}</div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium text-primary">{operation.code || '—'}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {operation.status || 'Pendiente'}
                  </span>
                </div>
              </button>
            );
          })}
      </div>

      <div className="hidden lg:flex lg:flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Moneda</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    <span className="inline-flex items-center">
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      Buscando coincidencias…
                    </span>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-red-600">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && !operations.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                    No se encontraron operaciones para conciliar con el movimiento seleccionado.
                  </td>
                </tr>
              )}

              {operations.map((operation) => {
                const badge = operationTypeBadge(operation);
                const isSelected = selectedIds.includes(operation.id);
                const amount = new Intl.NumberFormat(
                  operation.currency === 'USD' ? 'en-US' : 'es-AR',
                  { style: 'currency', currency: operation.currency }
                ).format(operation.amount);

                return (
                  <tr
                    key={operation.id}
                    className={`table-row-selectable ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggle(operation.id)}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={() => onToggle(operation.id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-text-primary">
                      {formatDate(operation.confirmedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-primary">
                      {operation.description || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {operation.currency}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-text-primary">{amount}</td>
                    <td className="px-4 py-4 text-sm text-primary font-medium">
                      {operation.code || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {operation.status || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{operations.length}</span> opciones sugeridas.
          </div>
          <div className="text-xs text-gray-500">
            Seleccioná una o más operaciones para compensar el movimiento.
          </div>
        </div>
      </div>

      <div className="lg:hidden bg-white px-4 py-3 border-t border-gray-200 flex flex-col gap-1">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-medium">{operations.length}</span> opciones sugeridas.
        </div>
        <div className="text-xs text-gray-500">
          Seleccioná una o más operaciones para compensar el movimiento.
        </div>
      </div>
    </div>
  );
};
