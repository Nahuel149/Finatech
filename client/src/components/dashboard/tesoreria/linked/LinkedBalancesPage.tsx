import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ApiError,
  TreasuryLinkedBalanceSummaryEntry,
  TreasuryMovement,
} from '../../../../types';
import {
  useLinkedBalanceDetail,
  useLinkedTreasuryBalances,
} from '../../../../hooks';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import { Alert } from '../../../ui';
import { LinkedBalancesSummarySection } from './LinkedBalancesSummarySection';
import { LinkedBalancesMovementsSection } from './LinkedBalancesMovementsSection';
import { LinkedBalancesAccountingSection } from './LinkedBalancesAccountingSection';
import { LinkedBalanceDetailPanel } from './LinkedBalanceDetailPanel';

type ToastState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

type DetailPanelFilters = {
  dateFrom: string | null;
  dateTo: string | null;
  type: 'incoming' | 'outgoing' | null;
};

const formatTime = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const ensureBalanceOrder = (
  balances: TreasuryLinkedBalanceSummaryEntry[]
): TreasuryLinkedBalanceSummaryEntry[] => {
  const order = ['usd', 'cash', 'transfers'];
  return [...balances].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  );
};

export const LinkedBalancesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [globalSearch, setGlobalSearch] = useState('');

  const {
    data: balancesData,
    generatedAt,
    loading,
    error,
    refresh,
  } = useLinkedTreasuryBalances();

  const [activeBalanceId, setActiveBalanceId] = useState<string>('usd');
  const orderedBalances = useMemo(
    () => ensureBalanceOrder(balancesData),
    [balancesData]
  );

  useEffect(() => {
    if (!orderedBalances.length) {
      return;
    }
    const exists = orderedBalances.some((balance) => balance.id === activeBalanceId);
    if (!exists) {
      setActiveBalanceId(orderedBalances[0].id);
    }
  }, [activeBalanceId, orderedBalances]);

  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
      showToast({
        type: 'success',
        message: 'Saldos actualizados correctamente.',
      });
    } catch (err) {
      const apiError = err as ApiError;
      showToast({
        type: 'error',
        message: apiError.message || 'No pudimos actualizar los saldos.',
      });
    } finally {
      setRefreshing(false);
    }
  }, [refresh, showToast]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBalanceId, setDetailBalanceId] = useState<string | null>(null);
  const [detailFilters, setDetailFilters] = useState<DetailPanelFilters>({
    dateFrom: null,
    dateTo: null,
    type: null,
  });
  const [detailPage, setDetailPage] = useState(1);

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
    reset: resetDetail,
  } = useLinkedBalanceDetail(
    detailBalanceId,
    detailBalanceId
      ? {
          ...detailFilters,
          page: detailPage,
          limit: 10,
        }
      : {},
    { autoFetch: detailOpen }
  );

  useEffect(() => {
    if (!detailOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [detailOpen]);

  const activeBalance = useMemo(
    () =>
      orderedBalances.find((balance) => balance.id === activeBalanceId) ||
      orderedBalances[0] ||
      null,
    [activeBalanceId, orderedBalances]
  );

  const handleSelectBalance = (balanceId: string) => {
    setActiveBalanceId(balanceId);
  };

  const handleOpenDetail = (balanceId: string) => {
    setActiveBalanceId(balanceId);
    setDetailBalanceId(balanceId);
    setDetailFilters({
      dateFrom: null,
      dateTo: null,
      type: null,
    });
    setDetailPage(1);
    setDetailOpen(true);
    navigate(`/dashboard/tesoreria/saldos?balance=${balanceId}`, { replace: false });
  };

  const handleCloseDetail = () => {
    navigate('/dashboard/tesoreria/saldos', { replace: true });
    setDetailOpen(false);
    setDetailBalanceId(null);
    setDetailFilters({
      dateFrom: null,
      dateTo: null,
      type: null,
    });
    setDetailPage(1);
    resetDetail();
  };

  const handleDetailFiltersChange = (next: DetailPanelFilters) => {
    setDetailFilters(next);
    setDetailPage(1);
  };

  const handleViewMovement = (movement: TreasuryMovement) => {
    const targetId = movement.id || movement.movementCode;
    if (!targetId) {
      showToast({
        type: 'info',
        message: 'El movimiento no tiene un identificador disponible.',
      });
      return;
    }
    navigate(`/dashboard/tesoreria/movimientos/${targetId}`);
  };

  const handleViewAllMovements = (balanceId?: string) => {
    if (balanceId) {
      showToast({
        type: 'info',
        message: `Redirigiendo al módulo de movimientos (${balanceId}).`,
      });
    }
    navigate('/dashboard/tesoreria');
  };

  const handleViewInAccounts = (balanceId: string) => {
    showToast({
      type: 'info',
      message: `Próximamente podrás ver la cuenta ${balanceId} en Cuentas Corrientes.`,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const balanceParam = params.get('balance');
    if (
      balanceParam &&
      orderedBalances.some((balance) => balance.id === balanceParam)
    ) {
      if (detailBalanceId !== balanceParam || !detailOpen) {
        setActiveBalanceId(balanceParam);
        setDetailBalanceId(balanceParam);
        setDetailFilters({ dateFrom: null, dateTo: null, type: null });
        setDetailPage(1);
        setDetailOpen(true);
      }
    } else if (!balanceParam && detailOpen) {
      setDetailOpen(false);
      setDetailBalanceId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, orderedBalances]);

  const lastSyncTime = formatTime(generatedAt);

  return (
    <div className="min-h-screen bg-gray-50">
      <TreasuryNavbar search={globalSearch} onSearchChange={setGlobalSearch} />
      <TreasuryBalanceStripe onSelectBalance={handleOpenDetail} />

      <main id="linked-balances-container" className="pt-[220px] px-6 pb-24">
        <section id="page-header" className="mb-8 mt-4">
          <nav
            id="breadcrumbs"
            className="flex items-center space-x-2 text-sm text-gray-600 mb-4"
            aria-label="Breadcrumb"
          >
            <span className="text-primary font-medium cursor-pointer">Tesorería</span>
            <i className="fa-solid fa-chevron-right text-xs" />
            <span>Saldos y cuentas vinculadas</span>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Saldos y cuentas vinculadas
              </h1>
              <p className="text-gray-600">
                Visualizá el estado actualizado de las cuentas de Tesorería y los últimos movimientos
                registrados
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <i
                className={`fa-solid ${
                  refreshing ? 'fa-spinner fa-spin' : 'fa-sync'
                } mr-2`}
              />
              {refreshing ? 'Actualizando...' : 'Actualizar manualmente'}
            </button>
          </div>
        </section>

        <LinkedBalancesSummarySection
          balances={orderedBalances}
          loading={loading}
          onViewDetail={(balanceId) => handleOpenDetail(balanceId)}
          onSelectBalance={handleSelectBalance}
        />

        <LinkedBalancesMovementsSection
          balances={orderedBalances}
          loading={loading}
          activeBalanceId={activeBalance?.id || activeBalanceId}
          onTabChange={handleSelectBalance}
          onViewMovement={handleViewMovement}
          onViewAll={handleViewAllMovements}
        />

        <LinkedBalancesAccountingSection
          balances={orderedBalances}
          loading={loading}
          onViewInAccounts={handleViewInAccounts}
        />

        <section
          id="footer-section"
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <i className="fa-solid fa-sync mr-2" />
              <span>Actualizado automáticamente al cursar operaciones</span>
              <div className="ml-4 text-xs text-gray-500">
                Última sincronización: {lastSyncTime}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Los saldos se actualizan también al registrar o compensar movimientos
            </div>
          </div>
        </section>
      </main>

      <LinkedBalanceDetailPanel
        open={detailOpen}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        filters={detailFilters}
        onChangeFilters={handleDetailFiltersChange}
        onClose={handleCloseDetail}
        onViewMovement={handleViewMovement}
        onViewAllMovements={() => {
          handleViewAllMovements(detailBalanceId || undefined);
          handleCloseDetail();
        }}
        onRetry={refreshDetail}
      />

      {error && !loading && (
        <div className="fixed top-24 right-4 z-[60] w-full max-w-sm">
          <Alert type="error" message={error.message || 'No pudimos cargar los saldos.'} />
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-[70] w-full max-w-sm">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
