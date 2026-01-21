import React, { Suspense, useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCancelTreasuryMovement } from '../../../hooks/dashboard/useCancelTreasuryMovement';
import { useClientsList } from '../../../hooks/dashboard/useClientsList';
import { useTreasuryMovements, TreasuryMovementsFilters, TreasuryMovementsSortOption } from '../../../hooks/dashboard/useTreasuryMovements';
import { Alert } from '../../ui/Alert';
import { TreasuryNavbar } from './TreasuryNavbar';
import { TreasuryBalanceStripe } from './TreasuryBalanceStripe';
import { TreasuryHeader } from './TreasuryHeader';
import { TreasuryFilters } from './TreasuryFilters';
import { TreasuryMovementsTable } from './TreasuryMovementsTable';
import { MovementDetailPanel } from './detail/MovementDetailPanel';
import { Footer } from '../operaciones/Footer';
import { ApiError } from '../../../types/auth';
import { ClientSummary } from '../../../types/client';
import { TreasuryMovement } from '../../../types/treasury';
const RegisterMovementModal = React.lazy(() =>
  import('./register/RegisterMovementModal').then((module) => ({ default: module.RegisterMovementModal }))
);
const ReconciliationModal = React.lazy(() =>
  import('./reconciliation/ReconciliationModal').then((module) => ({ default: module.ReconciliationModal }))
);

type ToastState = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
};

const EMPTY_FILTERS: TreasuryMovementsFilters = {
  dateFrom: '',
  dateTo: '',
  type: '',
  medium: '',
  currency: '',
  status: '',
  contactId: '',
  search: '',
};

const movementIdentifier = (movement: TreasuryMovement) =>
  movement.movementCode || movement.reference || movement.id || 'movimiento';

const areFiltersEqual = (left: TreasuryMovementsFilters, right: TreasuryMovementsFilters) =>
  left.dateFrom === right.dateFrom &&
  left.dateTo === right.dateTo &&
  left.type === right.type &&
  left.medium === right.medium &&
  left.currency === right.currency &&
  left.status === right.status &&
  left.contactId === right.contactId &&
  left.search === right.search;

export const TreasuryMovementsPage: React.FC = () => {
  const [draftFilters, setDraftFilters] = useState<TreasuryMovementsFilters>(EMPTY_FILTERS);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [prefillOperation, setPrefillOperation] = useState<{ id?: string | null; code?: string | null } | null>(null);
  const [prefillContact, setPrefillContact] = useState<ClientSummary | null>(null);
  const [editMovement, setEditMovement] = useState<TreasuryMovement | null>(null);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);
  const searchUpdateSourceRef = useRef<'navbar' | 'filters' | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const location = useLocation();
  const { movementId: movementIdParam } = useParams<{ movementId?: string }>();
  const detailMovementId = movementIdParam ?? null;

  const {
    items,
    loading,
    error,
    refresh,
    pagination,
    goToPage,
    totals,
    filters,
    applyFilters,
    clearFilters,
    sort,
    updateSort,
  } = useTreasuryMovements();

  const {
    clients,
    loading: contactsLoading,
    error: contactsError,
    refresh: refreshContacts,
  } = useClientsList(50);

  const {
    cancelMovement,
    loading: cancellingMovement,
    error: cancelError,
    reset: resetCancel,
  } = useCancelTreasuryMovement();

  useEffect(() => {
    setDraftFilters((prev) => (areFiltersEqual(prev, filters) ? prev : filters));
    setGlobalSearch((prev) => (prev === filters.search ? prev : filters.search));
  }, [filters]);

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
  }, []);

  useEffect(() => {
    if (searchUpdateSourceRef.current !== 'navbar') {
      return;
    }
    if (globalSearch === filters.search) {
      searchUpdateSourceRef.current = null;
      return;
    }
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      applyFilters({ search: globalSearch });
      searchUpdateSourceRef.current = null;
    }, 300);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [applyFilters, filters.search, globalSearch]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDraftChange = <K extends keyof TreasuryMovementsFilters>(
    field: K,
    value: TreasuryMovementsFilters[K]
  ) => {
    setDraftFilters((prev) => {
      if (prev[field] === value) {
        return prev;
      }
      return {
        ...prev,
        [field]: value,
      };
    });
    if (field === 'search') {
      searchUpdateSourceRef.current = 'filters';
      const nextSearch = String(value);
      setGlobalSearch((prev) => (prev === nextSearch ? prev : nextSearch));
    }
  };

  const handleApplyFilters = useCallback(() => {
    searchUpdateSourceRef.current = null;
    startTransition(() => {
      applyFilters(draftFilters);
    });
    showToast({
      type: 'success',
      message: 'Filtros aplicados correctamente.',
    });
  }, [applyFilters, draftFilters, showToast, startTransition]);

  const handleClearFilters = useCallback(() => {
    searchUpdateSourceRef.current = null;
    setDraftFilters(EMPTY_FILTERS);
    setGlobalSearch('');
    startTransition(() => {
      clearFilters();
    });
    showToast({
      type: 'info',
      message: 'Filtros limpiados.',
    });
  }, [clearFilters, showToast, startTransition]);

  const handleGlobalSearchChange = useCallback((value: string) => {
    if (value === globalSearch) {
      return;
    }
    searchUpdateSourceRef.current = 'navbar';
    setGlobalSearch(value);
    setDraftFilters((prev) => ({
      ...prev,
      search: value,
    }));
  }, [globalSearch]);

  const handleRegisterMovement = useCallback(() => {
    setRegisterOpen(true);
    setEditMovement(null);
    setPrefillOperation(null);
    setPrefillContact(null);
  }, []);

  const handleOpenConciliation = useCallback(() => {
    setReconciliationOpen(true);
  }, []);

  const handleSelectBalanceStripe = useCallback((balanceId: string) => {
    navigate(`/dashboard/tesoreria/saldos?account=${balanceId}`);
  }, [navigate]);

  const handleOpenSettings = useCallback(() => {
    showToast({
      type: 'info',
      message: 'Configuración de Tesorería disponible próximamente.',
    });
  }, [showToast]);

  const handleOpenMovementDetail = useCallback((movement: TreasuryMovement) => {
    if (!movement.id) return;
    navigate(`/dashboard/tesoreria/movimientos/${movement.id}`);
  }, [navigate]);

  const handleViewDetail = useCallback((movement: TreasuryMovement) => {
    handleOpenMovementDetail(movement);
  }, [handleOpenMovementDetail]);

  const handleView = useCallback((movement: TreasuryMovement) => {
    handleOpenMovementDetail(movement);
  }, [handleOpenMovementDetail]);

  const handleEdit = (movement: TreasuryMovement) => {
    handleEditMovement(movement);
  };

  const handleCancelMovement = useCallback(async (movement: TreasuryMovement) => {
    if (!movement.id) return;

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas anular ${movementIdentifier(movement)}?`
    );
    if (!confirmed) {
      return;
    }

    const reasonPrompt = window.prompt('Motivo de anulación (opcional):', '');
    const reason = reasonPrompt && reasonPrompt.trim().length ? reasonPrompt.trim() : undefined;

    try {
      const updated = await cancelMovement(movement.id, reason);
      showToast({
        type: 'success',
        message: `Movimiento ${movementIdentifier(updated)} anulado correctamente.`,
      });
      await refresh();
      if (detailMovementId === movement.id) {
        setDetailRefreshToken((prev) => prev + 1);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      showToast({
        type: 'error',
        message: apiErr.message || 'No pudimos anular el movimiento.',
      });
    }
  }, [cancelMovement, detailMovementId, refresh, showToast]);

  const handlePageChange = useCallback((pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > pagination.totalPages) return;
    goToPage(pageNumber);
  }, [goToPage, pagination.totalPages]);

  const handleSortChange = useCallback((nextSort: TreasuryMovementsSortOption) => {
    updateSort(nextSort);
  }, [updateSort]);

  const handleRegisterSuccess = useCallback((movement: TreasuryMovement) => {
    refresh();
    if (detailMovementId && movement?.id === detailMovementId) {
      setDetailRefreshToken((prev) => prev + 1);
    }
  }, [detailMovementId, refresh]);

  const handleCloseMovementDetail = useCallback(() => {
    resetCancel();
    navigate('/dashboard/tesoreria', { replace: true });
  }, [navigate, resetCancel]);

  const handleEditMovement = useCallback((movement: TreasuryMovement) => {
    if (movement.status !== 'registered') {
      showToast({
        type: 'warning',
        message: 'Solo podes editar movimientos pendientes.',
      });
      return;
    }
    setEditMovement(movement);
    setRegisterOpen(false);
    setPrefillOperation(null);
    setPrefillContact(null);
    if (detailMovementId) {
      handleCloseMovementDetail();
    }
  }, [detailMovementId, handleCloseMovementDetail, showToast]);

  useEffect(() => {
    const state = location.state as
      | {
          fromOperationId?: string | null;
          fromOperationCode?: string | null;
          fromOperationContact?: ClientSummary | null;
        }
      | undefined;

    if (state?.fromOperationId || state?.fromOperationCode) {
      setPrefillOperation({
        id: state.fromOperationId || undefined,
        code: state.fromOperationCode || undefined,
      });
      setPrefillContact(state.fromOperationContact || null);
      setRegisterOpen(true);
      navigate(
        {
          pathname: location.pathname,
          search: location.search,
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, location.state, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col text-sm lg:text-base">
      <TreasuryNavbar search={globalSearch} onSearchChange={handleGlobalSearchChange} />
      <TreasuryBalanceStripe onSelectBalance={handleSelectBalanceStripe} />

      <main id="movimientos-container" className="pt-[220px] px-6 pb-24 flex-1">
        <TreasuryHeader
          onRegisterMovement={handleRegisterMovement}
          onOpenConciliation={handleOpenConciliation}
          onOpenSettings={handleOpenSettings}
        />

        <TreasuryFilters
          values={draftFilters}
          onChange={handleDraftChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          contacts={clients}
          contactsLoading={contactsLoading}
          contactsError={contactsError}
          onRetryContacts={refreshContacts}
        />

        <TreasuryMovementsTable
          items={items}
          loading={loading}
          error={error}
          onRetry={refresh}
          pagination={pagination}
          onPageChange={handlePageChange}
          sort={sort}
          onSortChange={handleSortChange}
          totals={totals}
          onViewDetail={handleViewDetail}
          onView={handleView}
          onEdit={handleEdit}
          onCancel={handleCancelMovement}
        />
      </main>

      <Suspense fallback={null}>
        <RegisterMovementModal
          open={registerOpen || Boolean(editMovement)}
          prefillOperation={editMovement ? null : prefillOperation}
          prefillContact={editMovement ? null : prefillContact}
          mode={editMovement ? 'edit' : 'create'}
          movement={editMovement}
          onClose={() => {
            setRegisterOpen(false);
            setEditMovement(null);
            setPrefillOperation(null);
            setPrefillContact(null);
          }}
          onSuccess={handleRegisterSuccess}
          onShowToast={showToast}
        />
      </Suspense>

      <MovementDetailPanel
        open={Boolean(detailMovementId)}
        movementId={detailMovementId}
        onClose={handleCloseMovementDetail}
        onEdit={handleEditMovement}
        onCancel={handleCancelMovement}
        cancelling={cancellingMovement}
        cancelError={cancelError}
        refreshToken={detailRefreshToken}
        onShowToast={showToast}
      />

      <Suspense fallback={null}>
        <ReconciliationModal
          open={reconciliationOpen}
          onClose={() => setReconciliationOpen(false)}
          onShowToast={showToast}
          onSuccess={() => {
            refresh();
            setDetailRefreshToken((prev) => prev + 1);
          }}
        />
      </Suspense>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] w-full max-w-sm">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}

      <Footer />
    </div>
  );
};










