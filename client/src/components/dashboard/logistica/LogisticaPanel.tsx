import React, { Suspense, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui/Alert';
import { FilterPanel } from './FilterPanel';
import { OperationDetailPanel } from './OperationDetailPanel';
import { LogisticsOperationsSection } from './LogisticsOperationsSection';
import { TreasuryIntegrationSection } from './TreasuryIntegrationSection';
import { GeneralSummarySection } from './GeneralSummarySection';
import { LogisticsFilters, LogisticsOperation, LogisticsOperationUpdatePayload } from '../../../types/logistics';
import { useLogisticsOperations } from '../../../hooks/dashboard/useLogisticsOperations';
import { api, handleApiError } from '../../../utils/api';
import { Button } from '../../shared/design-system/Button';
import { ApiError } from '../../../types/auth';
import { MyLogisticsOrdersPage } from './MyLogisticsOrdersPage';
const NewMovementModal = React.lazy(() => import('./NewMovementModal'));
const EditLogisticsOperationModal = React.lazy(() => import('./EditLogisticsOperationModal'));
const BulkEditLogisticsOperationsModal = React.lazy(() => import('./BulkEditLogisticsOperationsModal'));
const BulkStateChangeModal = React.lazy(() => import('./BulkStateChangeModal'));

type ToastState = {
  type: 'success' | 'info' | 'error';
  message: string;
};

export const LogisticaPanel: React.FC = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<LogisticsOperation | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingAction, setPendingAction] = useState<'complete' | 'cancel' | 'restore' | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<ApiError | null>(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditSaving, setBulkEditSaving] = useState(false);
  const [bulkEditError, setBulkEditError] = useState<ApiError | null>(null);
  const [bulkStateContext, setBulkStateContext] = useState<{
    action: 'complete' | 'cancel' | 'archive' | 'restore';
    operations: LogisticsOperation[];
  } | null>(null);
  const [bulkStateSaving, setBulkStateSaving] = useState(false);
  const [bulkStateError, setBulkStateError] = useState<ApiError | null>(null);
  const [, startTransition] = useTransition();

  const {
    operations,
    metrics,
    filters,
    loading: operationsLoading,
    error: operationsError,
    refresh: refreshOperations,
    updateFilters,
    resetFilters,
    contacts,
    responsibles,
    pagination,
  } = useLogisticsOperations();
  const [searchInput, setSearchInput] = useState(filters.search);
  const searchDebounceRef = useRef<number | null>(null);

  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  // Default to the operational panel when entering Logistica.
  const [activeView, setActiveView] = useState<'overview' | 'my-orders'>('overview');

  const selectedOperationIdSet = useMemo(
    () => new Set(selectedOperations),
    [selectedOperations]
  );
  const operationsIdSet = useMemo(
    () => new Set(operations.map((operation) => operation.id)),
    [operations]
  );
  const selectedOperationsData = useMemo(
    () => operations.filter((operation) => selectedOperationIdSet.has(operation.id)),
    [operations, selectedOperationIdSet]
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);



  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterToggle = () => {
    setFilterOpen((prev) => !prev);
  };

  const handleBulkActionRequest = (action: 'edit' | 'complete' | 'cancel' | 'archive' | 'restore') => {
    if (!selectedOperations.length) {
      setToast({ type: 'info', message: 'Seleccioná operaciones antes de ejecutar acciones masivas.' });
      return;
    }

    if (!selectedOperationsData.length) {
      setToast({ type: 'info', message: 'No encontramos las operaciones seleccionadas. Actualizá la vista e intentá nuevamente.' });
      return;
    }

    if (action === 'edit') {
      setBulkEditError(null);
      setIsBulkEditModalOpen(true);
      return;
    }

    let eligibleOperations = selectedOperationsData;
    if (action === 'complete') {
      eligibleOperations = selectedOperationsData.filter(
        (operation) => !['completado', 'anulado'].includes(operation.status)
      );
    } else if (action === 'cancel') {
      eligibleOperations = selectedOperationsData.filter((operation) => operation.status !== 'anulado');
    } else if (action === 'archive') {
      eligibleOperations = selectedOperationsData.filter((operation) => !operation.archived);
    } else if (action === 'restore') {
      eligibleOperations = selectedOperationsData.filter((operation) => operation.archived);
    }

    if (!eligibleOperations.length) {
      setToast({
        type: 'info',
        message:
          action === 'complete'
            ? 'Las operaciones seleccionadas ya están completadas o anuladas.'
            : action === 'cancel'
            ? 'Las operaciones seleccionadas ya fueron anuladas.'
            : action === 'archive'
            ? 'Las operaciones seleccionadas ya estaban archivadas.'
            : 'Las operaciones seleccionadas ya están visibles en el panel.',
      });
      return;
    }

    setBulkStateError(null);
    setBulkStateContext({ action, operations: eligibleOperations });
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedOperations(ids);
  };

  const handleSubmitBulkEdit = async (payload: LogisticsOperationUpdatePayload) => {
    if (!selectedOperationsData.length) {
      setIsBulkEditModalOpen(false);
      return;
    }
    const operationsCount = selectedOperationsData.length;
    setBulkEditSaving(true);
    setBulkEditError(null);
    try {
      await Promise.all(
        selectedOperationsData.map((operation) => api.updateLogisticsOperation(operation.id, payload))
      );
      setToast({
        type: 'success',
        message: `Actualizamos ${operationsCount} operación${operationsCount === 1 ? '' : 'es'} correctamente.`,
      });
      setIsBulkEditModalOpen(false);
      setSelectedOperations([]);
      await refreshOperations();
    } catch (err) {
      setBulkEditError(handleApiError(err));
    } finally {
      setBulkEditSaving(false);
    }
  };

  const handleConfirmBulkStateChange = async () => {
    if (!bulkStateContext) {
      return;
    }
    const { action, operations: targetOperations } = bulkStateContext;
    setBulkStateSaving(true);
    setBulkStateError(null);
    try {
      if (action === 'archive') {
        await api.archiveLogisticsOperations(targetOperations.map((operation) => operation.id));
        setToast({
          type: 'success',
          message: `Archivamos ${targetOperations.length} operación${targetOperations.length === 1 ? '' : 'es'} correctamente.`,
        });
      } else if (action === 'restore') {
        await api.restoreLogisticsOperations(targetOperations.map((operation) => operation.id));
        setToast({
          type: 'success',
          message: `Restauramos ${targetOperations.length} operación${targetOperations.length === 1 ? '' : 'es'} al panel.`,
        });
      } else {
        const nextState = action === 'complete' ? 'completado' : 'anulado';
        await Promise.all(
          targetOperations.map((operation) =>
            api.updateLogisticsOperationState(operation.id, { state: nextState })
          )
        );
        setToast({
          type: 'success',
          message:
            action === 'complete'
              ? `Marcamos ${targetOperations.length} operación${targetOperations.length === 1 ? '' : 'es'} como completadas.`
              : `Anulamos ${targetOperations.length} movimiento${targetOperations.length === 1 ? '' : 's'}.`,
        });
      }
      setBulkStateContext(null);
      setSelectedOperations([]);
      await refreshOperations();
    } catch (err) {
      setBulkStateError(handleApiError(err));
    } finally {
      setBulkStateSaving(false);
    }
  };

  const handleViewOperation = (operation: LogisticsOperation) => {
    setSelectedOperation(operation);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedOperation(null);
    setPendingAction(null);
  };

  const handleEditSelectedOperation = () => {
    if (!selectedOperation) {
      return;
    }
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateOperationState = async (
    nextState: 'completado' | 'anulado',
    action: 'complete' | 'cancel'
  ) => {
    if (!selectedOperation) {
      return;
    }
    try {
      setPendingAction(action);
      await api.updateLogisticsOperationState(selectedOperation.id, { state: nextState });
      setSelectedOperation((prev) => (prev ? { ...prev, status: nextState } : prev));
      await refreshOperations();
      setToast({
        type: 'success',
        message:
          nextState === 'completado'
            ? 'Operación marcada como completada.'
            : 'Operación anulada correctamente.',
      });
    } catch (err) {
      const parsedError = handleApiError(err);
      setToast({
        type: 'error',
        message: parsedError.message || 'No pudimos actualizar la operación seleccionada.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleMarkOperationCompleted = () => handleUpdateOperationState('completado', 'complete');
  const handleCancelOperation = () => handleUpdateOperationState('anulado', 'cancel');

  const handleRestoreOperation = async () => {
    if (!selectedOperation) {
      return;
    }
    try {
      setPendingAction('restore');
      await api.restoreLogisticsOperations([selectedOperation.id]);
      await refreshOperations();
      setToast({ type: 'success', message: 'Operación restaurada correctamente.' });
      setSelectedOperation((prev) => (prev ? { ...prev, archived: false } : prev));
    } catch (err) {
      setToast({ type: 'error', message: handleApiError(err).message || 'No pudimos restaurar la operación.' });
    } finally {
      setPendingAction(null);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditError(null);
  };

  const handleSubmitEditOperation = async (payload: LogisticsOperationUpdatePayload) => {
    if (!selectedOperation) {
      return;
    }
    try {
      setSavingEdit(true);
      setEditError(null);
      await api.updateLogisticsOperation(selectedOperation.id, payload);
      await refreshOperations();
      setToast({ type: 'success', message: 'Operación actualizada correctamente.' });
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(handleApiError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApplyFilters = (nextFilters: LogisticsFilters) => {
    startTransition(() => {
      updateFilters(() => nextFilters);
    });
    setToast({ type: 'success', message: 'Filtros aplicados correctamente.' });
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    startTransition(() => {
      resetFilters();
    });
    setToast({ type: 'info', message: 'Filtros limpiados.' });
  };

  const handleRegisterNewMovement = () => {
    setIsNewMovementModalOpen(true);
  };

  const handleCloseNewMovementModal = () => {
    setIsNewMovementModalOpen(false);
  };

  useEffect(() => {
    setSelectedOperations((prev) => {
      const next = prev.filter((operationId) => operationsIdSet.has(operationId));
      return next.length === prev.length ? prev : next;
    });
  }, [operationsIdSet]);

  useEffect(() => {
    setSearchInput((prev) => (prev === filters.search ? prev : filters.search));
  }, [filters.search]);

  useEffect(() => {
    if (searchInput === filters.search) {
      return;
    }
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 300);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [filters.search, searchInput, updateFilters]);

  useEffect(() => {
    if (isBulkEditModalOpen && !selectedOperationsData.length) {
      setIsBulkEditModalOpen(false);
    }
  }, [isBulkEditModalOpen, selectedOperationsData.length]);

  const selectedOperationId = selectedOperation?.id;

  useEffect(() => {
    if (!selectedOperationId) {
      return;
    }
    const updatedOperation = operations.find((operation) => operation.id === selectedOperationId);
    if (updatedOperation) {
      setSelectedOperation(updatedOperation);
    }
  }, [operations, selectedOperationId]);

  const totalOperations = pagination.totalItems || operations.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={searchInput} onSearchChange={handleSearchChange} />
      <BalanceStripe />

      <main
        id="logistics-main"
        className="flex-grow pt-[420px] lg:pt-[250px] pb-8 px-4 lg:px-6"
      >
        <div className="w-full">
          <section
            id="logistics-header"
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Logística</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Gestión integral de operaciones logísticas y movimientos de efectivo
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="inline-flex rounded-full border border-gray-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    activeView === 'overview' ? 'bg-primary text-white shadow' : 'text-gray-600'
                  }`}
                >
                  Panel operativo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('my-orders')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    activeView === 'my-orders' ? 'bg-primary text-white shadow' : 'text-gray-600'
                  }`}
                >
                  Mis órdenes
                </button>
              </div>
              {activeView === 'overview' && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRegisterNewMovement}
                  icon="fa-solid fa-plus"
                  className="w-full sm:w-auto font-medium"
                >
                  Registrar nuevo movimiento logístico
                </Button>
              )}
            </div>
          </section>

          {activeView === 'overview' ? (
            <>
              <GeneralSummarySection metrics={metrics} loading={operationsLoading} />

              <LogisticsOperationsSection
                operations={operations}
                selectedOperations={selectedOperations}
                onSelectionChange={handleSelectionChange}
                onFilterClick={handleFilterToggle}
                onBulkAction={handleBulkActionRequest}
                onViewOperation={handleViewOperation}
                totalOperations={totalOperations}
                loading={operationsLoading}
                error={operationsError}
                onRetry={refreshOperations}
              />

              <TreasuryIntegrationSection />
            </>
          ) : (
            <MyLogisticsOrdersPage />
          )}
        </div>
      </main>

      <Footer />

      <FilterPanel
        isOpen={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        contactOptions={contacts}
        responsibleOptions={responsibles}
        operations={operations}
      />

      <Suspense fallback={null}>
        <BulkEditLogisticsOperationsModal
          isOpen={isBulkEditModalOpen}
          operations={selectedOperationsData}
          saving={bulkEditSaving}
          errorMessage={bulkEditError?.message}
          onClose={() => {
            setIsBulkEditModalOpen(false);
            setBulkEditError(null);
          }}
          onSubmit={handleSubmitBulkEdit}
        />

        {bulkStateContext && (
          <BulkStateChangeModal
            isOpen
            action={bulkStateContext.action}
            operations={bulkStateContext.operations}
            loading={bulkStateSaving}
            errorMessage={bulkStateError?.message}
            onClose={() => {
              setBulkStateContext(null);
              setBulkStateError(null);
            }}
            onConfirm={handleConfirmBulkStateChange}
          />
        )}
      </Suspense>

      <OperationDetailPanel
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        operation={selectedOperation}
        onEditOperation={handleEditSelectedOperation}
        onMarkAsCompleted={handleMarkOperationCompleted}
        onCancelOperation={handleCancelOperation}
        onRestoreOperation={handleRestoreOperation}
        pendingAction={pendingAction}
      />

      <Suspense fallback={null}>
        <NewMovementModal isOpen={isNewMovementModalOpen} onClose={handleCloseNewMovementModal} />

        <EditLogisticsOperationModal
          isOpen={isEditModalOpen}
          operation={selectedOperation}
          saving={savingEdit}
          errorMessage={editError?.message}
          onClose={handleCloseEditModal}
          onSubmit={handleSubmitEditOperation}
        />
      </Suspense>

      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};

export default LogisticaPanel;
