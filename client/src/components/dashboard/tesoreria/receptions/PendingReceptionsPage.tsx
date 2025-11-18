import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_PENDING_RECEPTIONS_FILTERS,
  PendingReceptionFilters,
  usePendingReceptions,
  useReceptionActions,
  useUserPermissions,
} from '../../../../hooks';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import { PendingReceptionsFilters } from './PendingReceptionsFilters';
import { PendingReceptionsTable } from './PendingReceptionsTable';
import { ReceptionDetailPanel } from './ReceptionDetailPanel';
import { ConfirmReceptionModal } from './ConfirmReceptionModal';
import { OmitReceptionModal } from './OmitReceptionModal';
import { RevertReceptionModal } from './RevertReceptionModal';
import { Alert } from '../../../ui';
import {
  TreasuryReception,
  ConfirmTreasuryReceptionPayload,
  OmitTreasuryReceptionPayload,
  RevertTreasuryReceptionPayload,
} from '../../../../types';
import { Footer } from '../../operaciones/Footer';
import { emitDashboardBalanceRefresh } from '../../../../utils';
import { TreasurySectionNav } from '../TreasurySectionNav';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const PendingReceptionsPage: React.FC = () => {
  const location = useLocation();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const canViewReceptions = permissions.includes('treasury:receptions');
  const canRevertReceptions = permissions.includes('treasury:receptions:revert');

  const {
    receptions,
    filters,
    pagination,
    loading,
    error,
    applyFilters,
    clearFilters,
    goToPage,
    refresh,
  } = usePendingReceptions({ enabled: canViewReceptions });

  const { confirmReception, omitReception, revertReception, runningAction, error: actionError } =
    useReceptionActions();

  const [draftFilters, setDraftFilters] = useState<PendingReceptionFilters>(
    DEFAULT_PENDING_RECEPTIONS_FILTERS
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedReception, setSelectedReception] = useState<TreasuryReception | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [omitModalOpen, setOmitModalOpen] = useState(false);
  const [revertModalOpen, setRevertModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setDraftFilters(filters);
    setGlobalSearch(filters.search);
  }, [filters]);

  useEffect(() => {
    if (!receptions.length) {
      setSelectedReception(null);
      return;
    }
    setSelectedReception((current) => {
      if (current) {
        const updated = receptions.find((item) => item.id === current.id);
        if (updated) {
          return updated;
        }
      }
      return receptions[0];
    });
  }, [receptions]);

  useEffect(() => {
    if (!location.search) {
      return;
    }
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId) {
      setDraftFilters((prev) => ({ ...prev, operation: orderId }));
      applyFilters({ ...filters, operation: orderId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (nextToast: ToastState) => {
    setToast(nextToast);
  };

  const handleFilterChange = <K extends keyof PendingReceptionFilters>(
    field: K,
    value: PendingReceptionFilters[K]
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    applyFilters(draftFilters);
  };

  const handleClearFilters = () => {
    setDraftFilters(DEFAULT_PENDING_RECEPTIONS_FILTERS);
    clearFilters();
  };

  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    setDraftFilters((prev) => ({ ...prev, search: value }));
    applyFilters({ ...filters, search: value });
  };

  const handleSelectReception = (reception: TreasuryReception) => {
    setSelectedReception(reception);
  };

  const handleConfirmReception = async (payload: ConfirmTreasuryReceptionPayload) => {
    if (!selectedReception) return;
    try {
      const updated = await confirmReception(selectedReception.id, payload);
      setConfirmModalOpen(false);
      setSelectedReception(updated);
      showToast({ type: 'success', message: 'Recepción confirmada correctamente.' });
      emitDashboardBalanceRefresh();
      await refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'No pudimos confirmar la recepción.' });
    }
  };

  const handleOmitReception = async (payload: OmitTreasuryReceptionPayload) => {
    if (!selectedReception) return;
    try {
      const updated = await omitReception(selectedReception.id, payload);
      setOmitModalOpen(false);
      setSelectedReception(updated);
      showToast({ type: 'info', message: 'Recepción marcada como omitida.' });
      await refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'No pudimos omitir la recepción.' });
    }
  };

  const handleRevertReception = async (payload: RevertTreasuryReceptionPayload) => {
    if (!selectedReception) return;
    try {
      const updated = await revertReception(selectedReception.id, payload);
      setRevertModalOpen(false);
      setSelectedReception(updated);
      showToast({ type: 'success', message: 'Recepción revertida correctamente.' });
      emitDashboardBalanceRefresh();
      await refresh();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'No pudimos revertir la recepción.' });
    }
  };

  const canConfirmAction = useMemo(
    () => selectedReception?.receptionStatus === 'pending' && canViewReceptions,
    [selectedReception, canViewReceptions]
  );
  const canOmitAction = canConfirmAction;
  const canRevertAction = useMemo(() => {
    if (!selectedReception || !canRevertReceptions) return false;
    return ['confirmed', 'omitted'].includes(selectedReception.receptionStatus);
  }, [selectedReception, canRevertReceptions]);

  const mainContent = !canViewReceptions && !permissionsLoading ? (
    <div className="bg-white border border-amber-200 rounded-lg p-6 text-amber-700">
      No tenés permisos para ver las recepciones pendientes de Tesorería.
    </div>
  ) : (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <PendingReceptionsFilters
          values={draftFilters}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
        <PendingReceptionsTable
          items={receptions}
          loading={loading || permissionsLoading}
          error={error}
          onRetry={refresh}
          pagination={pagination}
          onPageChange={goToPage}
          onSelect={handleSelectReception}
          selectedId={selectedReception?.id || null}
        />
      </div>
      <div className="lg:col-span-1">
        <ReceptionDetailPanel
          reception={selectedReception}
          actionError={actionError}
          runningAction={runningAction}
          onConfirm={() => setConfirmModalOpen(true)}
          onOmit={() => setOmitModalOpen(true)}
          onRevert={() => setRevertModalOpen(true)}
          canConfirm={Boolean(canConfirmAction)}
          canOmit={Boolean(canOmitAction)}
          canRevert={Boolean(canRevertAction)}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col text-sm lg:text-base">
      <TreasuryNavbar search={globalSearch} onSearchChange={handleGlobalSearchChange} />
      <TreasuryBalanceStripe />

      <main className="pt-[260px] px-6 pb-24 flex-1">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <TreasurySectionNav active="recepciones" />
            <div>
              <p className="text-sm text-gray-500">Tesorería / Recepciones pendientes</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Recepciones pendientes</h1>
              <p className="text-sm text-gray-600">
                Gestioná el impacto contable de las órdenes logísticas completadas (CA1 a CA7).
              </p>
            </div>
          </div>

          {mainContent}
        </div>
      </main>

      <ConfirmReceptionModal
        open={confirmModalOpen}
        reception={selectedReception}
        loading={runningAction === 'confirm'}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmReception}
      />

      <OmitReceptionModal
        open={omitModalOpen}
        reception={selectedReception}
        loading={runningAction === 'omit'}
        onClose={() => setOmitModalOpen(false)}
        onSubmit={handleOmitReception}
      />

      <RevertReceptionModal
        open={revertModalOpen}
        reception={selectedReception}
        loading={runningAction === 'revert'}
        onClose={() => setRevertModalOpen(false)}
        onRevert={handleRevertReception}
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[60] w-full max-w-sm">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}

      <Footer />
    </div>
  );
};
