import React, { useEffect, useMemo, useState } from 'react';
import { useCompensateTreasuryMovement } from '../../../../hooks/dashboard/useCompensateTreasuryMovement';
import { useReconciliationSuggestions } from '../../../../hooks/dashboard/useReconciliationSuggestions';
import { useTreasuryMovements } from '../../../../hooks/dashboard/useTreasuryMovements';
import { useUserPermissions } from '../../../../hooks/useUserPermissions';
import { ApiError } from '../../../../types/auth';
import { TreasuryMovement, OperationSuggestion } from '../../../../types/treasury';
import { ReconciliationFilters, ReconciliationFiltersState } from './ReconciliationFilters';
import { ReconciliationOperationsTable } from './ReconciliationOperationsTable';
import { ReconciliationMovementsPanel } from './ReconciliationMovementsPanel';
import { ReconciliationSummary } from './ReconciliationSummary';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Props {
  open: boolean;
  onClose: () => void;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
  onSuccess: () => void;
}

const DEFAULT_FILTERS: ReconciliationFiltersState = {
  operationType: '',
  currency: '',
  contact: '',
  dateFrom: '',
  dateTo: '',
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const ReconciliationModal: React.FC<Props> = ({ open, onClose, onShowToast, onSuccess }) => {
  const {
    items: pendingMovements,
    refresh: refreshPendingMovements,
  } = useTreasuryMovements({
    limit: 50,
    autoRefreshMs: 0,
    initialFilters: { status: 'registered' },
  });

  const [movementFilter, setMovementFilter] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<TreasuryMovement | null>(null);
  const [filters, setFilters] = useState<ReconciliationFiltersState>(DEFAULT_FILTERS);
  const [selectedOperationIds, setSelectedOperationIds] = useState<string[]>([]);

  const {
    movement: suggestionMovement,
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
    reset: resetSuggestions,
  } = useReconciliationSuggestions(selectedMovement?.id ?? null);

  const {
    compensateMovement,
    loading: compensating,
    reset: resetCompensate,
  } = useCompensateTreasuryMovement();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const canManageTreasury = permissions.includes('manage-treasury');

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = 'unset';
      return () => {};
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    if (open && pendingMovements.length && !selectedMovement) {
      setSelectedMovement(pendingMovements[0]);
    }
  }, [open, pendingMovements, selectedMovement]);

  useEffect(() => {
    if (!open) {
      setSelectedOperationIds([]);
      setSelectedMovement(null);
      setFilters(DEFAULT_FILTERS);
      resetSuggestions();
      resetCompensate();
    }
  }, [open, resetSuggestions, resetCompensate]);

  useEffect(() => {
    if (!canManageTreasury) {
      setSelectedOperationIds([]);
    }
  }, [canManageTreasury]);

  const activeMovement = suggestionMovement || selectedMovement;

  const filteredOperations = useMemo(() => {
    const byFilters = suggestions.filter((operation) => {
      const operationCurrency = operation.originalCurrency || operation.currency;
      if (filters.currency && operationCurrency !== filters.currency) {
        return false;
      }
      if (filters.contact && !(`${operation.description || ''}`.toLowerCase().includes(filters.contact.toLowerCase()))) {
        return false;
      }
      if (filters.operationType) {
        const type = (operation.movementType || '').toLowerCase();
        if (!type.includes(filters.operationType)) {
          return false;
        }
      }
      return true;
    });
    return byFilters;
  }, [suggestions, filters]);

  const operationsTotal = useMemo(() => {
    if (!activeMovement || !selectedOperationIds.length) {
      return 0;
    }
    return filteredOperations
      .filter((operation) => selectedOperationIds.includes(operation.id))
      .reduce((sum, operation) => sum + operation.amount, 0);
  }, [filteredOperations, activeMovement, selectedOperationIds]);

  const movementAmount = activeMovement ? Math.abs(activeMovement.amount || 0) : 0;
  const difference = operationsTotal - movementAmount;
  const formattedOperationsTotal = activeMovement
    ? formatCurrency(operationsTotal, activeMovement.currency || 'ARS')
    : '$0,00';
  const formattedMovementTotal = activeMovement
    ? formatCurrency(movementAmount, activeMovement.currency || 'ARS')
    : '$0,00';
  const formattedDifference = activeMovement
    ? formatCurrency(difference, activeMovement.currency || 'ARS')
    : '$0,00';
  const isBalanced = Math.abs(difference) < 0.01 && !!selectedOperationIds.length;
  const summaryWarning = !canManageTreasury
    ? 'No tenés permiso para compensar movimientos.'
    : Math.abs(difference) > 0.01
    ? 'Los montos no coinciden exactamente, revisá antes de confirmar.'
    : null;

  const handleSelectMovement = (movement: TreasuryMovement) => {
    setSelectedMovement(movement);
    setSelectedOperationIds([]);
  };

  const handleToggleOperation = (operationId: string) => {
    if (!canManageTreasury) {
      return;
    }
    setSelectedOperationIds((prev) =>
      prev.includes(operationId)
        ? prev.filter((id) => id !== operationId)
        : [...prev, operationId]
    );
  };

  const handleConfirm = async () => {
    if (!canManageTreasury) {
      onShowToast({ type: 'warning', message: 'No tenés permiso para compensar movimientos.' });
      return;
    }

    if (!selectedMovement || !selectedOperationIds.length) {
      return;
    }

    try {
      const primaryOperation: OperationSuggestion | undefined = filteredOperations.find((op) =>
        selectedOperationIds.includes(op.id)
      );
      if (!primaryOperation) {
        onShowToast({ type: 'error', message: 'Seleccioná una operación válida.' });
        return;
      }

      await compensateMovement(selectedMovement.id || '', {
        operation: {
          id: primaryOperation.id,
          model: primaryOperation.model,
        },
        amount: Math.abs(selectedMovement.amount || 0),
      });

      onShowToast({
        type: 'success',
        message: `Movimiento ${selectedMovement.movementCode || selectedMovement.id} compensado correctamente.`,
      });

      await refreshPendingMovements();
      onSuccess();
      onClose();
    } catch (error) {
      const apiError = error as ApiError;
      onShowToast({
        type: 'error',
        message: apiError.message || 'No se pudo compensar el movimiento seleccionado.',
      });
    }
  };

  const handleSaveDraft = () => {
    onShowToast({
      type: 'info',
      message: 'El guardado de borradores estará disponible próximamente.',
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] max-h-[95vh] flex flex-col border border-gray-200 overflow-hidden">
          <div className="bg-white border-b border-gray-200 p-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <span className="text-primary font-medium">Tesorería</span>
              <i className="fa-solid fa-chevron-right text-xs" />
              <span>Conciliación</span>
            </nav>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Conciliar operaciones pendientes</h1>
                <p className="text-gray-600">
                  Vinculá movimientos con operaciones abiertas para compensar sus saldos
                </p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-xl"
                onClick={onClose}
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ReconciliationFilters
                filters={filters}
                onUpdate={(next) => setFilters((prev) => ({ ...prev, ...next }))}
                onClear={() => setFilters(DEFAULT_FILTERS)}
              />

              <div className="flex-1 min-h-0 flex flex-col gap-6 px-4 pb-6 lg:flex-row lg:gap-4 lg:px-6 lg:pb-0">
                <div className="flex-1 min-h-0 order-2 lg:order-1">
                  <ReconciliationOperationsTable
                    operations={filteredOperations}
                    selectedIds={selectedOperationIds}
                    onToggle={canManageTreasury ? handleToggleOperation : () => {}}
                    loading={suggestionsLoading}
                    error={suggestionsError ? suggestionsError.message : null}
                  />
                </div>

                <div className="w-full lg:w-[420px] flex-shrink-0 min-h-0 h-full order-1 lg:order-2">
                  <ReconciliationMovementsPanel
                    movements={pendingMovements}
                    selectedMovementId={activeMovement?.id || null}
                    onSelect={handleSelectMovement}
                    filter={movementFilter}
                    onFilterChange={(value) => setMovementFilter(value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <ReconciliationSummary
            operationsCount={selectedOperationIds.length}
            movementsCount={activeMovement ? 1 : 0}
            operationsTotalLabel={formattedOperationsTotal}
            movementTotalLabel={formattedMovementTotal}
            differenceLabel={formattedDifference}
            isBalanced={isBalanced}
            warning={summaryWarning}
            disableConfirm={!canManageTreasury || !isBalanced || compensating || permissionsLoading}
            confirming={compensating}
            onCancel={onClose}
            onSaveDraft={handleSaveDraft}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
};
