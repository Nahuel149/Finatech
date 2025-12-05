import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui';
import { FilterPanel } from './FilterPanel';
import { OperationDetailPanel } from './OperationDetailPanel';
import { LogisticsOperationsSection } from './LogisticsOperationsSection';
import { TreasuryIntegrationSection } from './TreasuryIntegrationSection';
import { GeneralSummarySection } from './GeneralSummarySection';
import NewMovementModal from './NewMovementModal';
import { LogisticsFilters, LogisticsOperation, LogisticsOperationUpdatePayload } from '../../../types/logistics';
import { useDashboardBalances, useLogisticsOperations } from '../../../hooks';
import { subscribeDashboardBalanceRefresh, api, handleApiError } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType, Button } from '../../shared/design-system';
import { TreasuryBalance, ApiError } from '../../../types';
import { MyLogisticsOrdersPage } from './MyLogisticsOrdersPage';
import EditLogisticsOperationModal from './EditLogisticsOperationModal';
import BulkEditLogisticsOperationsModal from './BulkEditLogisticsOperationsModal';
import BulkStateChangeModal from './BulkStateChangeModal';

type ToastState = {
  type: 'success' | 'info' | 'error';
  message: string;
};

interface LogisticsBalanceStripeProps {
  onBalanceClick?: () => void;
  balances: TreasuryBalance[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
  mapBalanceToCardData: (balance: TreasuryBalance) => BalanceCardData;
}

const LogisticsBalanceStripe: React.FC<LogisticsBalanceStripeProps> = ({
  onBalanceClick,
  balances,
  loading,
  error,
  refresh,
  mapBalanceToCardData,
}) => {
  // Subscribe to balance refresh events
  useEffect(() => {
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      refresh().catch(() => {});
    });
    return unsubscribe;
  }, [refresh]);

  const [showTooltip, setShowTooltip] = useState(false);

  const visibleBalances = useMemo(
    () => balances.filter((balance) => balance.id !== 'courier_in_transit'),
    [balances]
  );

  const lastUpdatedLabel = useMemo(() => {
    const timestamps = visibleBalances
      .map((balance) => (balance.updatedAt ? new Date(balance.updatedAt).getTime() : null))
      .filter((value): value is number => Number.isFinite(value ?? NaN));

    if (!timestamps.length) {
      return 'Sin datos';
    }

    const maxTimestamp = Math.max(...timestamps);
    const date = new Date(maxTimestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Sin datos';
    }

    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [visibleBalances]);

  const handleShowTooltip = () => {
    setShowTooltip(true);
  };

  const handleHideTooltip = () => {
    setShowTooltip(false);
  };

  return (
    <div
      id="logistics-balance-stripe"
      className="fixed top-[55px] lg:top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40"
    >
      <div className="px-4 py-4 lg:px-8 lg:py-6 xl:px-12 xl:py-8 relative">
        <div
          className="absolute right-4 top-4 lg:right-8 lg:top-6 xl:right-12 xl:top-8"
          onMouseEnter={handleShowTooltip}
          onMouseLeave={handleHideTooltip}
        >
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white"
            onFocus={handleShowTooltip}
            onBlur={handleHideTooltip}
            aria-label="Ver última actualización de saldos logísticos"
          >
            <i className="fa-solid fa-clock-rotate-left text-sm" />
          </button>
          {showTooltip && (
            <div className="mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-xs text-gray-600 z-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-primary">Última actualización</span>
                <i className="fa-solid fa-clock text-gray-400" />
              </div>
              <p className="mt-2 text-gray-700">{lastUpdatedLabel}</p>
              {error && (
                <p className="mt-2 text-danger flex items-center space-x-1">
                  <i className="fa-solid fa-triangle-exclamation" />
                  <span>{error.message || 'No pudimos cargar los saldos.'}</span>
                </p>
              )}
              {!loading && !error && (
                <p className="mt-2 text-gray-500">Usá estos saldos para validar movimientos logísticos.</p>
              )}
            </div>
          )}
        </div>
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-3 lg:gap-4 xl:gap-6">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            visibleBalances.map((balance: TreasuryBalance) => (
              <BalanceCard
                key={balance.id}
                data={mapBalanceToCardData(balance)}
                onClick={onBalanceClick}
                onRetry={refresh}
                compact
                highlightBySign
              />
            ))}

          {!loading && error && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCard
                  key={i}
                  data={{
                    id: `error-${i}`,
                    label: 'Balance',
                    amount: 0,
                    currency: 'ARS',
                    status: 'error',
                    updatedAt: new Date().toISOString(),
                  }}
                  error
                  onClick={onBalanceClick}
                  onRetry={refresh}
                />
              ))}
            </>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="flex flex-col gap-2 md:gap-3">
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCardSkeleton key={i} />
                ))}
              </>
            )}

            {!loading && !error &&
              balances.filter((balance) => balance.id !== 'courier_in_transit').map((balance: TreasuryBalance) => (
                <BalanceCard
                  key={balance.id}
                  data={mapBalanceToCardData(balance)}
                  onClick={onBalanceClick}
                  onRetry={refresh}
                  compact
                  highlightBySign
                />
              ))}

            {!loading && error && (
              <>
                {[0, 1, 2].map((i) => (
                <BalanceCard
                  key={i}
                  data={{
                    id: `error-${i}`,
                    label: 'Balance',
                    amount: 0,
                    currency: 'ARS',
                    status: 'error',
                    updatedAt: new Date().toISOString(),
                  }}
                  error
                  onClick={onBalanceClick}
                  onRetry={refresh}
                />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogisticaPanel: React.FC = () => {
  const navigate = useNavigate();
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

  // Add dashboard balances hook for mobile layout
  const {
    balances,
    loading: balancesLoading,
    error: balancesError,
    refresh: refreshBalances,
  } = useDashboardBalances();


  const handleBalanceClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  // Add mapBalanceToCardData function for mobile layout
  const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => ({
    id: balance.id,
    label: balance.label,
    amount: balance.amount,
    currency: balance.currency,
    status: balance.status as StatusType,
    updatedAt: balance.updatedAt,
  });
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'my-orders'>('my-orders');

  const selectedOperationsData = useMemo(
    () => operations.filter((operation) => selectedOperations.includes(operation.id)),
    [operations, selectedOperations]
  );

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);



  const handleSearchChange = (value: string) => {
    updateFilters({ search: value });
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
    updateFilters(() => nextFilters);
    setToast({ type: 'success', message: 'Filtros aplicados correctamente.' });
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    resetFilters();
    setToast({ type: 'info', message: 'Filtros limpiados.' });
  };

  const handleRegisterNewMovement = () => {
    setIsNewMovementModalOpen(true);
  };

  const handleCloseNewMovementModal = () => {
    setIsNewMovementModalOpen(false);
  };

  useEffect(() => {
    setSelectedOperations((prev) =>
      prev.filter((operationId) => operations.some((operation) => operation.id === operationId))
    );
  }, [operations]);

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
      <DashboardNavbar search={filters.search} onSearchChange={handleSearchChange} />
      <LogisticsBalanceStripe 
        onBalanceClick={handleBalanceClick}
        balances={balances}
        loading={balancesLoading}
        error={balancesError}
        refresh={refreshBalances}
        mapBalanceToCardData={mapBalanceToCardData}
      />

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
                  onClick={() => setActiveView('my-orders')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    activeView === 'my-orders' ? 'bg-primary text-white shadow' : 'text-gray-600'
                  }`}
                >
                  Mis órdenes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    activeView === 'overview' ? 'bg-primary text-white shadow' : 'text-gray-600'
                  }`}
                >
                  Panel operativo
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

      <NewMovementModal isOpen={isNewMovementModalOpen} onClose={handleCloseNewMovementModal} />

      <EditLogisticsOperationModal
        isOpen={isEditModalOpen}
        operation={selectedOperation}
        saving={savingEdit}
        errorMessage={editError?.message}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEditOperation}
      />

      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};

export default LogisticaPanel;
