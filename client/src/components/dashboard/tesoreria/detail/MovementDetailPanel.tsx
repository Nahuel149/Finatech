import React, { useEffect, useMemo } from 'react';
import { ApiError, TreasuryMovement, TreasuryMovementOperationLink } from '../../../../types';
import { useTreasuryMovement, useClientDetail } from '../../../../hooks';
import { Alert } from '../../../ui';
import { MovementSummaryCard } from './MovementSummaryCard';
import { ContactInfoCard } from './ContactInfoCard';
import { LinkedOperationCard } from './LinkedOperationCard';
import { AccountingImpactCard } from './AccountingImpactCard';
import { MovementDetailSkeleton } from './MovementDetailSkeleton';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface MovementDetailPanelProps {
  open: boolean;
  movementId: string | null;
  onClose: () => void;
  onEdit: (movement: TreasuryMovement) => void;
  onCancel: (movement: TreasuryMovement) => Promise<void>;
  cancelling: boolean;
  cancelError: ApiError | null;
  refreshToken: number;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
}

interface AccountingEntry {
  account: string;
  currency: string;
  amount: number;
  counterpart?: string | null;
}

const balanceAccountLabel = (movement: TreasuryMovement) => {
  const currency = (movement.currency || 'ARS').toUpperCase();
  const medium = (movement.medium || '').toLowerCase();
  if (currency === 'USD') {
    if (medium === 'transfer') return 'Transferencias USD';
    if (medium === 'deposit') return 'Depósitos USD';
    return 'Caja USD';
  }
  if (medium === 'transfer') return 'Transferencias ARS';
  if (medium === 'deposit') return 'Depósitos ARS';
  return 'Efectivo ARS';
};

const counterpartAccountLabel = (movement: TreasuryMovement) => {
  const currency = (movement.currency || 'ARS').toUpperCase();
  const type = (movement.type || '').toLowerCase();
  if (type === 'outgoing') {
    return currency === 'USD' ? 'Cuentas a Pagar USD' : 'Cuentas a Pagar ARS';
  }
  return currency === 'USD' ? 'Cuentas a Cobrar USD' : 'Cuentas a Cobrar ARS';
};

const buildAccountingEntries = (
  movement: TreasuryMovement,
  contactName?: string | null
): AccountingEntry[] => {
  const currency = (movement.currency || 'ARS').toUpperCase();
  const amount = Number(movement.amount || 0);
  const isOutgoing = (movement.type || '').toLowerCase() === 'outgoing';
  const primaryAccountAmount = isOutgoing ? -amount : amount;
  const counterpartAmount = -primaryAccountAmount;

  return [
    {
      account: balanceAccountLabel(movement),
      currency,
      amount: primaryAccountAmount,
      counterpart: contactName || null,
    },
    {
      account: counterpartAccountLabel(movement),
      currency,
      amount: counterpartAmount,
      counterpart: contactName || null,
    },
  ];
};

const getPrimaryOperation = (operations?: TreasuryMovementOperationLink[]) =>
  operations && operations.length ? operations[0] : null;

export const MovementDetailPanel: React.FC<MovementDetailPanelProps> = ({
  open,
  movementId,
  onClose,
  onEdit,
  onCancel,
  cancelling,
  cancelError,
  refreshToken,
  onShowToast,
}) => {
  const { movement, loading, error, refresh } = useTreasuryMovement(open ? movementId : null);
  const contactId = movement?.contact?.id || null;
  const { client: contactDetail } = useClientDetail(open ? contactId : null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    if (!open || !movementId) return;
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  const contactName = movement?.contact?.fullName || movement?.contact?.shortName || contactDetail?.fullName;
  const operation = useMemo(
    () => getPrimaryOperation(movement?.linkedOperations),
    [movement?.linkedOperations]
  );

  const accountingEntries = useMemo(
    () => (movement ? buildAccountingEntries(movement, contactName) : []),
    [movement, contactName]
  );

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleEditClick = () => {
    if (!movement || movement.status !== 'registered') return;
    onEdit(movement);
  };

  const handleCancelClick = async () => {
    if (!movement || cancelling) return;
    try {
      await onCancel(movement);
    } catch (err) {
      // error is surfaced via cancelError prop
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 overlay transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[520px] bg-white detail-panel transform transition-transform ${
          open ? 'translate-x-0 slide-in-right' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Detalle del movimiento</h2>
                <p className="text-sm text-gray-600">
                  Consulta de información contable y vínculos asociados
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
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mt-4">
              <span className="text-primary">Tesorería</span>
              <i className="fa-solid fa-chevron-right text-xs" />
              <span>{movement?.movementCode || movement?.id || movementId || 'Movimiento'}</span>
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <MovementDetailSkeleton />}

            {!loading && error && (
              <div className="p-6">
                <Alert
                  type="error"
                  message={error.message || 'No pudimos cargar el detalle del movimiento.'}
                />
              </div>
            )}

            {!loading && !error && movement && (
              <div className="p-6 space-y-6">
                {cancelError && (
                  <Alert
                    type="error"
                    message={cancelError.message || 'No pudimos anular el movimiento.'}
                  />
                )}

                <MovementSummaryCard movement={movement} contactName={contactName} />

                <div className="space-y-6">
                  <ContactInfoCard
                    contact={{
                      name: movement.contact?.fullName || movement.contact?.shortName,
                      type: movement.contact?.contactType,
                      status: movement.contact?.status,
                    }}
                    clientDetail={contactDetail}
                    onViewAccount={() =>
                      onShowToast({
                        type: 'info',
                        message: 'La cuenta corriente del contacto estará disponible próximamente.',
                      })
                    }
                  />

                  <LinkedOperationCard
                    operation={operation}
                    onViewOperation={() =>
                      onShowToast({
                        type: 'info',
                        message: 'La vista de operación vinculada estará disponible próximamente.',
                      })
                    }
                  />
                </div>

                <AccountingImpactCard entries={accountingEntries} />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between space-x-4">
              <button
                type="button"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                onClick={handleEditClick}
                disabled={!movement || movement.status !== 'registered'}
              >
                <i className="fa-solid fa-edit mr-2" />
                Editar movimiento
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCancelClick}
                  disabled={!movement || cancelling}
                >
                  <i className="fa-solid fa-ban mr-2" />
                  {cancelling ? 'Anulando…' : 'Anular'}
                </button>
                <button
                  type="button"
                  className="flex items-center px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
