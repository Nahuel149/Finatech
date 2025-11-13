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
import { LogisticsFilters, LogisticsOperation } from '../../../types/logistics';
import { useDashboardBalances, useLogisticsOperations } from '../../../hooks';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType, Button } from '../../shared/design-system';
import { TreasuryBalance, ApiError } from '../../../types';
import { MyLogisticsOrdersPage } from './MyLogisticsOrdersPage';

type ToastState = {
  type: 'success' | 'info';
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

  const lastUpdatedLabel = useMemo(() => {
    const timestamps = balances
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
  }, [balances]);

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
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            balances.map((balance: TreasuryBalance) => (
              <BalanceCard
                key={balance.id}
                data={mapBalanceToCardData(balance)}
                onClick={onBalanceClick}
                onRetry={refresh}
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
          <div className="flex flex-col gap-3 md:gap-4">
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCardSkeleton key={i} />
                ))}
              </>
            )}

            {!loading && !error &&
              balances.map((balance: TreasuryBalance) => (
                <BalanceCard
                  key={balance.id}
                  data={mapBalanceToCardData(balance)}
                  onClick={onBalanceClick}
                  onRetry={refresh}
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
  const [activeView, setActiveView] = useState<'overview' | 'my-orders'>('overview');

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

  const handleBulkAction = () => {
    if (!selectedOperations.length) {
      setToast({ type: 'info', message: 'Seleccioná operaciones antes de ejecutar acciones masivas.' });
      return;
    }
    setToast({ type: 'success', message: 'Acciones masivas aplicadas correctamente.' });
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedOperations(ids);
  };

  const handleViewOperation = (operation: LogisticsOperation) => {
    setSelectedOperation(operation);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedOperation(null);
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
        <div className="max-w-7xl mx-auto w-full">
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
                onBulkAction={handleBulkAction}
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
      />

      <OperationDetailPanel
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        operation={selectedOperation}
      />

      <NewMovementModal isOpen={isNewMovementModalOpen} onClose={handleCloseNewMovementModal} />

      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};

export default LogisticaPanel;
