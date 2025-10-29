import React from 'react';
import { ApiError, LogisticsOperation } from '../../../types';

interface LogisticsOperationsSectionProps {
  operations: LogisticsOperation[];
  selectedOperations: string[];
  onSelectionChange: (operationIds: string[]) => void;
  onFilterClick: () => void;
  onBulkAction: () => void;
  onViewOperation: (operation: LogisticsOperation) => void;
  totalOperations: number;
  loading: boolean;
  error: ApiError | null;
  onRetry?: () => void;
}

const STATUS_META: Record<string, { label: string; tone: string }> = {
  'en-curso': { label: 'En curso', tone: 'bg-blue-100 text-blue-800' },
  pendiente: { label: 'Pendiente', tone: 'bg-yellow-100 text-yellow-800' },
  completado: { label: 'Completado', tone: 'bg-green-100 text-green-800' },
  anulado: { label: 'Anulado', tone: 'bg-red-100 text-red-700' },
};

const TYPE_META: Record<string, { label: string; tone: string }> = {
  entrega: { label: 'Entrega', tone: 'bg-blue-100 text-blue-800' },
  transferencia: { label: 'Transferencia', tone: 'bg-green-100 text-green-800' },
  retiro: { label: 'Retiro', tone: 'bg-purple-100 text-purple-800' },
  custodia: { label: 'Custodia', tone: 'bg-orange-100 text-orange-800' },
  'transferencia-interna': { label: 'Transferencia interna', tone: 'bg-indigo-100 text-indigo-800' },
};

const formatDateTime = (iso?: string) => {
  if (!iso) {
    return 'Sin fecha';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatAmount = (amount: number | null, currency: string) => {
  if (amount === null || Number.isNaN(amount)) {
    return '—';
  }

  const normalizedCurrency = currency?.toUpperCase() || 'ARS';

  return new Intl.NumberFormat(normalizedCurrency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const LogisticsOperationsSection: React.FC<LogisticsOperationsSectionProps> = ({
  operations,
  selectedOperations,
  onSelectionChange,
  onFilterClick,
  onBulkAction,
  onViewOperation,
  totalOperations,
  loading,
  error,
  onRetry,
}) => {
  const allSelected = operations.length > 0 && selectedOperations.length === operations.length;
  const startCount = operations.length > 0 ? 1 : 0;
  const endCount = operations.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(operations.map((operation) => operation.id));
  };

  const handleToggleSelection = (operationId: string) => {
    if (selectedOperations.includes(operationId)) {
      onSelectionChange(selectedOperations.filter((id) => id !== operationId));
      return;
    }
    onSelectionChange([...selectedOperations, operationId]);
  };

  return (
    <section id="logistics-operations-section" className="mb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Operaciones logísticas</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onFilterClick}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <i className="fa-solid fa-filter mr-2" />
            Filtros
          </button>
          <button
            type="button"
            onClick={onBulkAction}
            className={`flex items-center px-3 py-2 border border-gray-300 rounded-lg transition-colors text-sm ${
              selectedOperations.length ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
            }`}
            disabled={selectedOperations.length === 0}
          >
            <i className="fa-solid fa-tasks mr-2" />
            Acciones masivas
          </button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
              Cargando operaciones logísticas…
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-danger">
              No pudimos cargar las operaciones.
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-1 text-primary hover:text-blue-700 underline"
                >
                  Reintentar
                </button>
              )}
            </div>
          ) : operations.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
              No encontramos operaciones que coincidan con los filtros seleccionados.
            </div>
          ) : (
            operations.map((operation) => {
              const statusMeta = STATUS_META[operation.status] ?? STATUS_META['pendiente'];
              const typeMeta = TYPE_META[operation.type] ?? TYPE_META.entrega;

              return (
                <div
                  key={operation.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewOperation(operation)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                        checked={selectedOperations.includes(operation.id)}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleToggleSelection(operation.id);
                        }}
                        aria-label={`Seleccionar operación ${operation.operationCode}`}
                      />
                      <div>
                        <div className="text-sm font-medium text-primary">#{operation.operationCode}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(operation.date)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-primary hover:text-blue-700 text-sm p-1"
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewOperation(operation);
                      }}
                      aria-label={`Ver detalle de la operación ${operation.operationCode}`}
                    >
                      <i className="fa-solid fa-eye" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeMeta.tone}`}>
                        {typeMeta.label}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    
                    <div className="text-sm text-text-primary">
                      <div className="font-medium">{operation.contact}</div>
                      <div className="text-xs text-gray-600">{operation.route}</div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-text-primary">
                        {formatAmount(operation.amount, operation.currency)}
                      </span>
                      <span className="text-gray-600">{operation.responsible}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700">
          Mostrando {startCount}-{endCount} de {totalOperations} operaciones
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Seleccionar todas las operaciones visibles"
                  />
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Operación
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y hora
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto/Destinatario
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen/Destino
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responsable
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 xl:px-6 py-12 text-center text-sm text-gray-500">
                    Cargando operaciones logísticas…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-4 xl:px-6 py-12 text-center text-sm text-danger">
                    No pudimos cargar las operaciones.
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="ml-1 text-primary hover:text-blue-700 underline"
                      >
                        Reintentar
                      </button>
                    )}
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 xl:px-6 py-12 text-center text-sm text-gray-500">
                    No encontramos operaciones que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                operations.map((operation) => {
                  const statusMeta = STATUS_META[operation.status] ?? STATUS_META['pendiente'];
                  const typeMeta = TYPE_META[operation.type] ?? TYPE_META.entrega;

                  return (
                    <tr
                      key={operation.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewOperation(operation)}
                    >
                      <td className="px-4 xl:px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedOperations.includes(operation.id)}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleToggleSelection(operation.id);
                          }}
                          aria-label={`Seleccionar operación ${operation.operationCode}`}
                        />
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm font-medium text-primary">#{operation.operationCode}</td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-text-primary">{formatDateTime(operation.date)}</td>
                      <td className="px-4 xl:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeMeta.tone}`}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-text-primary">{operation.contact}</td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-text-primary">{operation.route}</td>
                      <td className="px-4 xl:px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-text-primary">
                        {formatAmount(operation.amount, operation.currency)}
                      </td>
                      <td className="px-4 xl:px-6 py-4 text-sm text-text-primary">{operation.responsible}</td>
                      <td className="px-4 xl:px-6 py-4">
                        <button
                          type="button"
                          className="text-primary hover:text-blue-700 text-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewOperation(operation);
                          }}
                          aria-label={`Ver detalle de la operación ${operation.operationCode}`}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 xl:px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-700">
          Mostrando {startCount}-{endCount} de {totalOperations} operaciones
        </div>
      </div>
    </section>
  );
};

export default LogisticsOperationsSection;
