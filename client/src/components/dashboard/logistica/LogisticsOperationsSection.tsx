import React from 'react';
import {
  FunnelIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../icons/HeroiconsOutline';

interface LogisticOperation {
  id: string;
  type: string;
  status: string;
  contact: string;
  amount: number;
  currency?: string;
  date: string;
  responsible: string;
  description?: string;
}

interface LogisticsOperationsSectionProps {
  operations: LogisticOperation[];
  selectedOperations: string[];
  onSelectionChange: (operationIds: string[]) => void;
  onBulkAction: (action: string) => void;
  onFilterToggle: () => void;
  onOperationOpen: (operation: LogisticOperation) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const LogisticsOperationsSection: React.FC<LogisticsOperationsSectionProps> = ({
  operations,
  selectedOperations,
  onSelectionChange,
  onBulkAction,
  onFilterToggle,
  onOperationOpen,
  currentPage,
  onPageChange
}) => {
  const STATUS_META: Record<string, { label: string; tone: string }> = {
    'en-transito': { label: 'En tránsito', tone: 'bg-blue-100 text-blue-800' },
    pendiente: { label: 'Pendiente', tone: 'bg-yellow-100 text-yellow-800' },
    completado: { label: 'Completado', tone: 'bg-green-100 text-green-800' },
    anulado: { label: 'Anulado', tone: 'bg-red-100 text-red-800' },
  };

  const TYPE_META: Record<string, { label: string; tone: string }> = {
    entrega: { label: 'Entrega', tone: 'bg-purple-100 text-purple-800' },
    retiro: { label: 'Retiro', tone: 'bg-orange-100 text-orange-800' },
    'transferencia-interna': {
      label: 'Transferencia interna',
      tone: 'bg-indigo-100 text-indigo-800',
    },
  };

  const getStatusBadge = (status: string) => STATUS_META[status]?.tone ?? 'bg-gray-100 text-gray-800';

  const getStatusLabel = (status: string) => STATUS_META[status]?.label ?? status;

  const getTypeBadge = (type: string) => TYPE_META[type]?.tone ?? 'bg-gray-100 text-gray-800';

  const getTypeLabel = (type: string) => TYPE_META[type]?.label ?? type;

  const formatAmount = (amount: number, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleOperationAction = (operation: LogisticOperation, action: string) => {
    console.log(`Action: ${action} on operation:`, operation.id);
    // Implement specific actions here
  };

  const handleToggleSelection = (operationId: string) => {
    const isSelected = selectedOperations.includes(operationId);
    if (isSelected) {
      onSelectionChange(selectedOperations.filter((id) => id !== operationId));
      return;
    }
    onSelectionChange([...selectedOperations, operationId]);
  };

  const handleToggleAll = () => {
    if (selectedOperations.length === operations.length && operations.length > 0) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(operations.map((operation) => operation.id));
  };

  return (
    <section id="logistics-operations-section" className="mb-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Operaciones logísticas</h2>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onFilterToggle}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </button>
          
          {selectedOperations.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedOperations.length} seleccionadas
              </span>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => onBulkAction('complete')}
              >
                Completar
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => onBulkAction('cancel')}
              >
                Anular
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]" aria-label="Listado de operaciones logísticas">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedOperations.length === operations.length && operations.length > 0}
                    onChange={handleToggleAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  ID Operación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Responsable
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {operations.map((operation) => (
                <tr
                  key={operation.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onOperationOpen(operation)}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedOperations.includes(operation.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelection(operation.id);
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {operation.id}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTypeBadge(operation.type)}`}>
                      {getTypeLabel(operation.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(operation.status)}`}>
                      {getStatusLabel(operation.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {operation.contact}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatAmount(operation.amount, operation.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(operation.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {operation.responsible}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOperationAction(operation, 'edit');
                        }}
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:text-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOperationAction(operation, 'complete');
                        }}
                        title="Completar"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOperationAction(operation, 'cancel');
                        }}
                        title="Anular"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              type="button"
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <button
              type="button"
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">1</span> a{' '}
                <span className="font-medium">{operations.length}</span> de{' '}
                <span className="font-medium">{operations.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  type="button"
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  {currentPage}
                </button>
                <button
                  type="button"
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
