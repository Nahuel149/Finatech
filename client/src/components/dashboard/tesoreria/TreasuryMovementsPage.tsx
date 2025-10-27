import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useClientsList,
  useTreasuryMovements,
  TreasuryMovementsFilters,
  TreasuryMovementsSortOption,
  useCancelTreasuryMovement,
} from '../../../hooks';
import { Alert } from '../../ui';
import { TreasuryNavbar } from './TreasuryNavbar';
import { TreasuryBalanceStripe } from './TreasuryBalanceStripe';
import { TreasuryHeader } from './TreasuryHeader';
import { TreasuryFilters } from './TreasuryFilters';
import { TreasuryMovementsTable } from './TreasuryMovementsTable';
import { ApiError, TreasuryMovement } from '../../../types';
import { RegisterMovementModal } from './register';
import { MovementDetailPanel } from './detail';
import { ReconciliationModal } from './reconciliation';

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

export const TreasuryMovementsPage: React.FC = () => {
  const [draftFilters, setDraftFilters] = useState<TreasuryMovementsFilters>(EMPTY_FILTERS);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [reconciliationOpen, setReconciliationOpen] = useState(false);
  const [detailRefreshToken, setDetailRefreshToken] = useState(0);
  const navigate = useNavigate();
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
    setDraftFilters(filters);
    setGlobalSearch(filters.search);
  }, [filters]);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDraftChange = <K extends keyof TreasuryMovementsFilters>(
    field: K,
    value: TreasuryMovementsFilters[K]
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === 'search') {
      setGlobalSearch(String(value));
    }
  };

  const handleApplyFilters = () => {
    applyFilters(draftFilters);
    showToast({
      type: 'success',
      message: 'Filtros aplicados correctamente.',
    });
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setGlobalSearch('');
    clearFilters();
    showToast({
      type: 'info',
      message: 'Filtros limpiados.',
    });
  };

  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    setDraftFilters((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const handleRegisterMovement = () => {
    setRegisterOpen(true);
  };

  const handleOpenConciliation = () => {
    setReconciliationOpen(true);
  };

  const handleSelectBalanceStripe = (balanceId: string) => {
    navigate(`/dashboard/tesoreria/saldos?balance=${balanceId}`);
  };

  const handleOpenSettings = () => {
    showToast({
      type: 'info',
      message: 'Configuración de Tesorería disponible próximamente.',
    });
  };

  const handleOpenMovementDetail = (movement: TreasuryMovement) => {
    if (!movement.id) return;
    navigate(`/dashboard/tesoreria/movimientos/${movement.id}`);
  };

  const handleViewDetail = (movement: TreasuryMovement) => {
    handleOpenMovementDetail(movement);
  };

  const handleView = (movement: TreasuryMovement) => {
    handleOpenMovementDetail(movement);
  };

  const handleEdit = (movement: TreasuryMovement) => {
    showToast({
      type: 'info',
      message: `Edición de ${movementIdentifier(movement)} estará disponible próximamente.`,
    });
  };

  const handleCancelMovement = async (movement: TreasuryMovement) => {
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
  };

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > pagination.totalPages) return;
    goToPage(pageNumber);
  };

  const handleSortChange = (nextSort: TreasuryMovementsSortOption) => {
    updateSort(nextSort);
  };

  const handleRegisterSuccess = (_movement: TreasuryMovement) => {
    refresh();
  };

  const handleCloseMovementDetail = () => {
    resetCancel();
    navigate('/dashboard/tesoreria', { replace: true });
  };

  const handleEditMovement = (movement: TreasuryMovement) => {
    showToast({
      type: 'info',
      message: `Edición de ${movementIdentifier(movement)} estará disponible próximamente.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TreasuryNavbar search={globalSearch} onSearchChange={handleGlobalSearchChange} />
      <TreasuryBalanceStripe onSelectBalance={handleSelectBalanceStripe} />

      <main id="treasury-container" className="pt-[220px] px-6 pb-24">
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

      <RegisterMovementModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
        onShowToast={showToast}
      />

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

      <ReconciliationModal
        open={reconciliationOpen}
        onClose={() => setReconciliationOpen(false)}
        onShowToast={showToast}
        onSuccess={() => {
          refresh();
          setDetailRefreshToken((prev) => prev + 1);
        }}
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[60] w-full max-w-sm">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
