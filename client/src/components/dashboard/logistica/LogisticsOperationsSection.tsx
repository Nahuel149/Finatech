import React from 'react';
import { ApiError } from '../../../types/auth';
import { LogisticsOperation } from '../../../types/logistics';

interface LogisticsOperationsSectionProps {
  operations: LogisticsOperation[];
  selectedOperations: string[];
  onSelectionChange: (operationIds: string[]) => void;
  onFilterClick: () => void;
  onBulkAction: (action: 'edit' | 'complete' | 'cancel' | 'archive' | 'restore') => void;
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

const listVisibilityStyle: React.CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '800px',
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


const LogisticsOperationCard = React.memo(
  ({
    operation,
    isSelected,
    onToggleSelection,
    onViewOperation,
  }: {
    operation: LogisticsOperation;
    isSelected: boolean;
    onToggleSelection: (operationId: string) => void;
    onViewOperation: (operation: LogisticsOperation) => void;
  }) => {
    const statusMeta = STATUS_META[operation.status] ?? STATUS_META['pendiente'];
    const typeMeta = TYPE_META[operation.type] ?? TYPE_META.entrega;

    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
          operation.archived ? 'opacity-80' : ''
        }`}
        onClick={() => onViewOperation(operation)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
              checked={isSelected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                onToggleSelection(operation.id);
              }}
              aria-label={`Seleccionar operaci??n ${operation.operationCode}`}
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
            aria-label={`Ver detalle de la operaci??n ${operation.operationCode}`}
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
            {operation.archived && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                Archivada
              </span>
            )}
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
  }
);

const LogisticsOperationRow = React.memo(
  ({
    operation,
    isSelected,
    onToggleSelection,
    onViewOperation,
  }: {
    operation: LogisticsOperation;
    isSelected: boolean;
    onToggleSelection: (operationId: string) => void;
    onViewOperation: (operation: LogisticsOperation) => void;
  }) => {
    const statusMeta = STATUS_META[operation.status] ?? STATUS_META['pendiente'];
    const typeMeta = TYPE_META[operation.type] ?? TYPE_META.entrega;

    return (
      <tr
        className={`hover:bg-gray-50 cursor-pointer ${operation.archived ? 'opacity-80' : ''}`}
        onClick={() => onViewOperation(operation)}
      >
        <td className="px-4 xl:px-6 py-4">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={isSelected}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              onToggleSelection(operation.id);
            }}
            aria-label={`Seleccionar operaci??n ${operation.operationCode}`}
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
          {operation.archived && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 text-gray-700">
              Archivada
            </span>
          )}
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
            aria-label={`Ver detalle de la operaci??n ${operation.operationCode}`}
          >
            <i className="fa-solid fa-eye" />
          </button>
        </td>
      </tr>
    );
  }
);

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
  const [bulkMenuOpen, setBulkMenuOpen] = React.useState(false);
  const selectedOperationSet = React.useMemo(
    () => new Set(selectedOperations),
    [selectedOperations]
  );
  const selectedOperationSetRef = React.useRef(new Set<string>());
  const operationsRef = React.useRef<LogisticsOperation[]>([]);

  React.useEffect(() => {
    selectedOperationSetRef.current = new Set(selectedOperations);
  }, [selectedOperations]);

  React.useEffect(() => {
    operationsRef.current = operations;
  }, [operations]);

  const handleSelectAll = React.useCallback(() => {
    const currentOperations = operationsRef.current;
    const currentSelected = selectedOperationSetRef.current;
    if (currentOperations.length && currentSelected.size === currentOperations.length) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(currentOperations.map((operation) => operation.id));
  }, [onSelectionChange]);

  const handleToggleSelection = React.useCallback((operationId: string) => {
    const next = new Set(selectedOperationSetRef.current);
    if (next.has(operationId)) {
      next.delete(operationId);
    } else {
      next.add(operationId);
    }
    onSelectionChange(Array.from(next));
  }, [onSelectionChange]);

  const handleBulkMenuToggle = () => {
    if (!selectedOperations.length) {
      return;
    }
    setBulkMenuOpen((prev) => !prev);
  };

  const handleBulkMenuAction = (action: 'edit' | 'complete' | 'cancel' | 'archive' | 'restore') => {
    setBulkMenuOpen(false);
    onBulkAction(action);
  };

  React.useEffect(() => {
    if (!bulkMenuOpen) {
      return;
    }
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('#logistics-bulk-action-menu-button') || target.closest('#logistics-bulk-action-menu')) {
        return;
      }
      setBulkMenuOpen(false);
    };
    document.addEventListener('click', handleClickAway);
    return () => {
      document.removeEventListener('click', handleClickAway);
    };
  }, [bulkMenuOpen]);

  React.useEffect(() => {
    if (!selectedOperations.length) {
      setBulkMenuOpen(false);
    }
  }, [selectedOperations.length]);

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
          <div className="relative">
            <button
              id="logistics-bulk-action-menu-button"
              type="button"
              onClick={handleBulkMenuToggle}
              className={`flex items-center px-3 py-2 border border-gray-300 rounded-lg transition-colors text-sm ${
                selectedOperations.length ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
              }`}
              disabled={selectedOperations.length === 0}
            >
              <i className="fa-solid fa-tasks mr-2" />
              Acciones masivas
              <i className="fa-solid fa-chevron-down text-xs ml-2" />
            </button>
            {bulkMenuOpen && (
              <div
                id="logistics-bulk-action-menu"
                className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-10"
              >
                <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Seleccioná una acción para {selectedOperations.length} operaciones
                </p>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50"
                  onClick={() => handleBulkMenuAction('edit')}
                >
                  <i className="fa-solid fa-pen-to-square text-primary mr-2" />
                  Editar operaciones
                </button>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50"
                  onClick={() => handleBulkMenuAction('complete')}
                >
                  <i className="fa-solid fa-circle-check text-green-600 mr-2" />
                  Marcar como completadas
                </button>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50 text-danger"
                  onClick={() => handleBulkMenuAction('cancel')}
                >
                  <i className="fa-solid fa-ban mr-2" />
                  Anular movimientos
                </button>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50"
                  onClick={() => handleBulkMenuAction('archive')}
                >
                  <i className="fa-solid fa-box-archive text-gray-600 mr-2" />
                  Archivar operaciones
                </button>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50"
                  onClick={() => handleBulkMenuAction('restore')}
                >
                  <i className="fa-solid fa-rotate-left text-indigo-600 mr-2" />
                  Restaurar operaciones
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden" style={listVisibilityStyle}>
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
            operations.map((operation) => (
              <LogisticsOperationCard
                key={operation.id}
                operation={operation}
                isSelected={selectedOperationSet.has(operation.id)}
                onToggleSelection={handleToggleSelection}
                onViewOperation={onViewOperation}
              />
            ))
          )}
        </div>
        
        <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-700">
          Mostrando {startCount}-{endCount} de {totalOperations} operaciones
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden" style={listVisibilityStyle}>
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
                operations.map((operation) => (
                  <LogisticsOperationRow
                    key={operation.id}
                    operation={operation}
                    isSelected={selectedOperationSet.has(operation.id)}
                    onToggleSelection={handleToggleSelection}
                    onViewOperation={onViewOperation}
                  />
                ))
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
