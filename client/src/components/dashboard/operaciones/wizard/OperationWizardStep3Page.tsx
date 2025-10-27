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
import { CompletionSuccessState } from './CompletionSuccessState';
import { CancelOperationModal } from './CancelOperationModal';

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

  useEffect(() => {
    if (!showToast) {
      return;
    }
    const timeout = window.setTimeout(() => setShowToast(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [showToast]);

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

  const canConfirm = validationItems.every((item) => item.passed) && Boolean(draft?.id);

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
      setSuccessMessage('Operación confirmada correctamente.');
      setSuccessStateVisible(true);
      await fetchDraft();
      setShowToast(true);
    } catch (error) {
      const apiError = error as ApiError;
      setFormError(apiError.message || 'No pudimos confirmar la operación.');
    }
  }, [canConfirm, draft?.id, fetchDraft, finalize]);

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
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="pt-[185px] px-6 pb-8 max-w-6xl mx-auto">
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

        {!isReady && draftLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center shadow-sm">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-sm text-gray-600">Cargando datos de la operación…</span>
          </div>
        )}

        {isReady && !successStateVisible && (
          <>
            <WizardCompleteSummary
              clientName={clientSummary?.fullName ?? '—'}
              clientDocument={clientSummary?.cuit}
              contact={clientSummary?.internalOwner}
              type={operationType}
              subtype={draft?.subtype ?? ''}
              incomingAssetLabel={draft?.incomingAsset?.label ?? incomingCurrency}
              outgoingAssetLabel={draft?.outgoingAsset?.label ?? outgoingCurrency}
              incomingAmount={draft?.incomingAmount ?? 0}
              outgoingAmount={draft?.outgoingAmount ?? 0}
              incomingCurrency={incomingCurrency}
              outgoingCurrency={outgoingCurrency}
              apr={draft?.apr ?? 0}
              marketApr={draft?.marketApr ?? 0}
              marginPercentage={draft?.marginPercentage ?? 0}
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
          />
        )}
      </main>

      <DashboardFooter />

      <CancelOperationModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
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
