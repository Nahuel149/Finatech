import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  ClientSummary,
  TransactionType,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
} from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { WizardCompleteSummary } from './WizardCompleteSummary';
import { FinalValidationChecklist, ValidationItem } from './FinalValidationChecklist';
import { WizardActions } from './WizardActions';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { apiRequest, handleApiError } from '../../../../utils/api';
import { CompletionSuccessState } from './CompletionSuccessState';
import { CancelOperationModal } from './CancelOperationModal';
import { emitDashboardBalanceRefresh } from '../../../../utils';

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Información de la operación' },
  { label: 'Liquidación', description: 'Método de pago' },
  { label: 'Resumen', description: 'Confirmación final' },
];

export const OperationWizardStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const draftId = searchParams.get('draftId');
  const presetTypeParam = (searchParams.get('tipo') || '').toLowerCase();

  const {
    draft,
    loading: draftLoading,
    saving,
    error: draftError,
    fetchDraft,
    finalize,
  } = useTransactionDraft(draftId);

  const { clients, setClients } = useClientsList(50);

  const [search, setSearch] = useState('');
  const [operationType, setOperationType] = useState<TransactionType>('buy');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successStateVisible, setSuccessStateVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidSuccess, setVoidSuccess] = useState(false);

  useEffect(() => {
    if (!showToast) {
      return;
    }
    const timeout = window.setTimeout(() => setShowToast(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [showToast]);

  useEffect(() => {
    if (draft?.status === 'voided') {
      setVoidSuccess(true);
    } else {
      setVoidSuccess(false);
    }
  }, [draft?.status]);

  useEffect(() => {
    if (draft) {
      const normalizedType: TransactionType = draft.type === 'sell' ? 'sell' : 'buy';
      setOperationType(normalizedType);

      const client = draft.client;
      if (client) {
        setClients((prev) => {
          if (prev.some((item) => item.id === client.id)) {
            return prev;
          }
          return [client, ...prev].filter((item): item is ClientSummary => Boolean(item));
        });
      }
    }
  }, [draft, setClients]);

  useEffect(() => {
    if (presetTypeParam === 'venta') {
      setOperationType('sell');
    } else if (presetTypeParam === 'compra') {
      setOperationType('buy');
    }
  }, [presetTypeParam]);

  const clientSummary = useMemo(() => {
    if (draft?.client) {
      return draft.client;
    }
    if (draft?.clientId) {
      return clients.find((client) => client.id === draft.clientId);
    }
    return undefined;
  }, [clients, draft?.client, draft?.clientId]);

  const incomingCurrency = draft?.incomingAsset?.code ?? 'ARS';
  const outgoingCurrency = draft?.outgoingAsset?.code ?? 'USD';
  const isVoided = draft?.status === 'voided';
  const canVoid = draft?.status === 'registered';
  const voidButtonDisabled = !canVoid || voiding;

  const marginValue = draft?.marginPercentage;
  const settlementPercentage = draft?.settlement?.totalPercentage ?? (draft?.settlement?.mode === 'simple' ? 100 : 0);

  const validationItems: ValidationItem[] = [
    {
      label: 'Margen dentro de parámetros permitidos',
      hint: 'Comparación contra los límites definidos por compliance.',
      passed: typeof marginValue === 'number' && Number.isFinite(marginValue) && Math.abs(marginValue) <= 10,
    },
    {
      label: 'Sumatoria de liquidación = 100%',
      hint: 'Debe asignarse el total del monto acordado en la liquidación.',
      passed:
        draft?.settlement?.mode === 'simple'
          ? Boolean(draft?.settlement?.simpleMethod)
          : Math.abs(settlementPercentage - 100) <= 0.1,
    },
    {
      label: 'Documentación del cliente verificada',
      hint: 'CUIT/CUIL y documentación respaldatoria validados.',
      passed: Boolean(clientSummary?.lastMarginPercentage !== null),
    },
    {
      label: 'Sin incidencias abiertas en Tesorería',
      hint: 'Verificá que el cliente no tenga saldos impagos o movimientos rechazados.',
      passed: true,
    },
  ];

  const canConfirm =
    validationItems.every((item) => item.passed) && Boolean(draft?.id) && !isVoided;

  const handleBackToStep = useCallback(
    (step: number) => {
      const tipo = operationType === 'sell' ? 'venta' : 'compra';
      navigate(
        step === 1
          ? `/dashboard/operaciones/nueva?draftId=${draft?.id ?? draftId ?? ''}&tipo=${tipo}`
          : `/dashboard/operaciones/nueva/liquidacion?draftId=${draft?.id ?? draftId ?? ''}&tipo=${tipo}`,
      );
    },
    [draft?.id, draftId, navigate, operationType],
  );

  const handleCancel = useCallback(() => {
    setCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    setCancelModalOpen(false);
    navigate('/dashboard');
  }, [navigate]);

  const handleSaveDraft = useCallback(() => {
    setFormError('Ya guardaste los pasos anteriores; confirmá la operación o cancelá para finalizar.');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || !draft?.id) {
      setFormError('Revisá los requisitos antes de confirmar.');
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      await finalize();
      emitDashboardBalanceRefresh();
      setSuccessMessage('Operación confirmada correctamente.');
      setSuccessStateVisible(true);
      await fetchDraft();
      setShowToast(true);
    } catch (error) {
      const apiError = error as ApiError;
      setFormError(apiError.message || 'No pudimos confirmar la operación.');
    }
  }, [canConfirm, draft?.id, fetchDraft, finalize]);

  const handleOpenVoidModal = useCallback(() => {
    setVoidReason('');
    setVoidError(null);
    setVoidModalOpen(true);
  }, []);

  const handleConfirmVoid = useCallback(async () => {
    if (!draft?.id) {
      setVoidError('No encontramos la operación para anular.');
      return;
    }
    setVoiding(true);
    setVoidError(null);
    try {
      await apiRequest(`/api/transactions/${draft.id}/void`, {
        method: 'POST',
        body: { reason: voidReason || null },
      });
      await fetchDraft();
      setVoidModalOpen(false);
      setVoidReason('');
      emitDashboardBalanceRefresh();
    } catch (error) {
      const apiError = handleApiError(error);
      setVoidError(apiError.message || 'No pudimos anular la operación.');
    } finally {
      setVoiding(false);
    }
  }, [draft?.id, fetchDraft, voidReason]);

  const handleCloseVoidModal = useCallback(() => {
    if (voiding) {
      return;
    }
    setVoidModalOpen(false);
    setVoidReason('');
    setVoidError(null);
  }, [voiding]);

  const handleViewDetails = useCallback(() => {
    if (!draft?.id) {
      navigate('/dashboard');
      return;
    }
    navigate(`/dashboard/operaciones?operacion=${draft.id}`);
  }, [draft?.id, navigate]);

  const handleNewOperation = useCallback(() => {
    navigate('/dashboard/operaciones/nueva');
  }, [navigate]);

  const busy = draftLoading || saving;
  const isReady = Boolean(draft);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="flex-grow pt-[550px] lg:pt-[250px] px-4 lg:px-6 pb-8 max-w-6xl mx-auto">
        <WizardHeader
          steps={WIZARD_STEPS}
          currentStep={2}
          onBack={() => navigate('/dashboard')}
        />

        {draftError && (
          <Alert type="error" message={draftError.message} className="mb-4" />
        )}
        {formError && (
          <Alert type="error" message={formError} className="mb-4" onClose={() => setFormError(null)} />
        )}
        {successMessage && (
          <Alert type="success" message={successMessage} className="mb-4" onClose={() => setSuccessMessage(null)} />
        )}
        {voidSuccess && (
          <Alert type="warning" message="La operación fue anulada. Las cuentas se revirtieron automáticamente." className="mb-4" />
        )}

        {!isReady && draftLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center shadow-sm">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-sm text-gray-600">Cargando datos de la operación…</span>
          </div>
        )}

        {isReady && !successStateVisible && (
          <>
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center"
              >
                <i className="fa-solid fa-file-export mr-2" />
                Exportar resumen (PDF)
              </button>
            </div>

            <WizardCompleteSummary
              clientName={clientSummary?.fullName ?? '—'}
              clientDocument={clientSummary?.cuit}
              contact={clientSummary?.internalOwner}
              type={operationType}
              incomingAssetLabel={draft?.incomingAsset?.label ?? incomingCurrency}
              outgoingAssetLabel={draft?.outgoingAsset?.label ?? outgoingCurrency}
              incomingAmount={draft?.incomingAmount ?? 0}
              outgoingAmount={draft?.outgoingAmount ?? 0}
              incomingCurrency={incomingCurrency}
              outgoingCurrency={outgoingCurrency}
              apr={draft?.apr ?? 0}
              marketApr={draft?.marketApr ?? 0}
              marginPercentage={draft?.marginPercentage ?? 0}
              clientLastMargin={clientSummary?.lastMarginPercentage ?? null}
              settlementMode={draft?.settlement?.mode ?? 'simple'}
              settlementSimpleMethod={draft?.settlement?.simpleMethod}
              settlementLines={draft?.settlement?.lines ?? []}
              lastUpdated={draft?.updatedAt}
              onEditStep1={() => handleBackToStep(1)}
              onEditStep2={() => handleBackToStep(2)}
            />

            <FinalValidationChecklist items={validationItems} />

            <WizardActions
              onBack={() => handleBackToStep(2)}
              backLabel="Atrás"
              onSaveDraft={() => handleSaveDraft()}
              onCancel={handleCancel}
              onContinue={handleConfirm}
              saving={busy}
              disableContinue={!canConfirm || busy}
              disableSave={busy}
            />
          </>
        )}

        {successStateVisible && (
          <CompletionSuccessState
            operationCode={draft?.operationCode ?? '—'}
            onViewDetails={handleViewDetails}
            onNewOperation={handleNewOperation}
            onVoid={isVoided ? undefined : handleOpenVoidModal}
            disableVoid={voidButtonDisabled}
          />
        )}
      </main>

      <DashboardFooter />

      <CancelOperationModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
      />

      <VoidOperationModal
        open={voidModalOpen}
        reason={voidReason}
        onReasonChange={(value) => {
          setVoidReason(value);
          setVoidError(null);
        }}
        onConfirm={handleConfirmVoid}
        onClose={handleCloseVoidModal}
        loading={voiding}
        error={voidError}
        canConfirm={voidReason.trim().length > 0}
      />

      {showToast && (
        <div className="fixed bottom-8 right-8 transform transition-transform duration-300 ease-out">
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3">
            <div className="w-8 h-8 bg-success bg-opacity-10 text-success rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check" />
            </div>
            <div className="text-sm text-text-primary">
              Operación confirmada y enviada a Tesorería.
            </div>
            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface VoidOperationModalProps {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  canConfirm: boolean;
}

const VoidOperationModal: React.FC<VoidOperationModalProps> = ({
  open,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
  loading,
  error,
  canConfirm,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text-primary">Anular operación</h2>
          <p className="text-sm text-gray-600">
            Indicá el motivo de la anulación. Este registro quedará disponible en la auditoría.
          </p>
        </div>
        <div className="px-6 py-6 space-y-4">
          {error && <Alert type="error" message={error} />}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="void-reason">
              Motivo
            </label>
            <textarea
              id="void-reason"
              rows={4}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describí por qué se anula la operación"
              disabled={loading}
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !canConfirm}
            className="px-4 py-2 text-sm text-white bg-danger rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Anulando...' : 'Confirmar anulación'}
          </button>
        </div>
      </div>
    </div>
  );
};
