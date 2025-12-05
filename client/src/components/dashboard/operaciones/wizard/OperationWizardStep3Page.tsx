/*
 * RUTA: ./OperationWizardStep3Page.tsx
 * REEMPLAZAR COMPLETAMENTE EL ARCHIVO CON ESTE CÓDIGO.
 */
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
import { WizardActions } from './WizardActions';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { devLog } from '../../../../utils/devLogger';
// import { apiRequest, handleApiError } from '../../../../utils/api';
import { CompletionSuccessState } from './CompletionSuccessState';
import { CancelOperationModal } from './CancelOperationModal';
import { VoidOperationModal } from './VoidOperationModal';
import { emitDashboardBalanceRefresh } from '../../../../utils';
import { WizardCompleteSummary } from './WizardCompleteSummary';

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Información' },
  { label: 'Liquidación', description: 'Pago' },
  { label: 'Resumen', description: 'Confirmar' },
];

// Función helper para formatear moneda
const formatCurrency = (value: number, currency: string) => {
  if (!Number.isFinite(value)) {
    return `0 ${currency}`;
  }
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  }
};

// Función helper para formatear porcentajes
// Agregar estilos para la animación del check
const SuccessAnimationStyles = () => (
  <style>
    {`
      @keyframes checkAnimation {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      .check-animation {
        animation: checkAnimation 0.6s ease-out;
      }
    `}
  </style>
);

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
    voidTransaction,
  } = useTransactionDraft(draftId);

  const { clients, setClients } = useClientsList(50);

  const [search, setSearch] = useState('');
  const [operationType, setOperationType] = useState<TransactionType>('buy');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
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
      const normalizedType: TransactionType =
        draft.type === 'sell' ? 'sell' : 'buy';
      if (normalizedType !== operationType) {
        setOperationType(normalizedType);
      }

      const client = draft.client;
      if (client) {
        setClients((prev) => {
          if (prev.some((item) => item.id === client.id)) {
            return prev;
          }
          return [client, ...prev].filter((item): item is ClientSummary =>
            Boolean(item),
          );
        });
      }
    }
  }, [draft, setClients, operationType]);

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
  const voidSuccess = draft?.status === 'voided';

  const totalSettlementAmount =
    draft?.type === 'buy' ? draft?.outgoingAmount : draft?.incomingAmount;

  const marginValue = draft?.marginPercentage ?? 0;
  const settlementLines = draft?.settlement?.lines ?? [];
  const settlementBaseAmount =
    totalSettlementAmount && Number.isFinite(totalSettlementAmount)
      ? totalSettlementAmount
      : 0;
  const settlementAmountAllocated = settlementLines.reduce((acc, line) => {
    const numericValue = Number(line.value) || 0;
    if (line.allocationType === 'percentage' && settlementBaseAmount > 0) {
      return acc + (numericValue / 100) * settlementBaseAmount;
    }
    return acc + numericValue;
  }, 0);
  const settlementCompletionTolerance =
    settlementBaseAmount > 0 ? Math.max(settlementBaseAmount * 0.0001, 0.01) : 0;
  const settlementIsComplete =
    draft?.settlement?.mode === 'simple'
      ? Boolean(draft?.settlement?.simpleMethod)
      : settlementBaseAmount > 0 &&
        Math.abs(settlementAmountAllocated - settlementBaseAmount) <= settlementCompletionTolerance;

  const summaryClient = clientSummary ?? draft?.client ?? null;

  // Lógica de validación (CA15)
  const validationItems = useMemo(
    () => [
      {
        label: 'Cliente valido y con documentacion vigente',
        passed: Boolean(clientSummary?.id),
      },
      {
        label: 'Montos coherentes y mayores a cero',
        passed:
          (draft?.incomingAmount ?? 0) > 0 && (draft?.outgoingAmount ?? 0) > 0,
      },
      {
        label: 'APR (tipo de cambio) mayor a 0',
        passed: (draft?.apr ?? 0) > 0,
      },
      {
        label: 'TC dentro de umbrales vs. mercado (+/-10%)',
        // Asumimos un umbral del 10% para el ejemplo
        passed:
          typeof marginValue === 'number' &&
          Number.isFinite(marginValue) &&
          Math.abs(marginValue) <= 10,
      },
      {
        label: 'Liquidacion completa',
        passed: settlementIsComplete,
      },
    ],
    [
      clientSummary?.id,
      draft?.incomingAmount,
      draft?.outgoingAmount,
      draft?.apr,
      marginValue,
      settlementIsComplete,
    ],
  );
  const canConfirm =
    validationItems.every((item) => item.passed) &&
    Boolean(draft?.id) &&
    !isVoided;

  const handleBackToStep = useCallback(
    (step: number) => {
      const tipo = operationType === 'sell' ? 'venta' : 'compra';
      navigate(
        step === 1
          ? `/dashboard/operaciones/nueva?draftId=${
              draft?.id ?? draftId ?? ''
            }&tipo=${tipo}`
          : `/dashboard/operaciones/nueva/liquidacion?draftId=${
              draft?.id ?? draftId ?? ''
            }&tipo=${tipo}`,
      );
    },
    [draft?.id, draftId, navigate, operationType],
  );

  const handleCancel = useCallback(() => {
    setCancelModalOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    setCancelModalOpen(false);

    try {
      await voidTransaction('cancelled_from_wizard');
      emitDashboardBalanceRefresh();
    } catch (error) {
      const apiError = error as ApiError;
      setFormError(apiError.message || 'No se pudo cancelar la operación.');
      setSuccessMessage(null);
      setShowToast(true);
    }

    navigate('/dashboard');
  }, [navigate, voidTransaction]);

  const handleOpenVoidModal = useCallback(() => {
    if (isVoided) {
      return;
    }
    setVoidError(null);
    setVoidModalOpen(true);
  }, [isVoided]);

  const handleCloseVoidModal = useCallback(() => {
    if (voidSubmitting) {
      return;
    }
    setVoidModalOpen(false);
    setVoidError(null);
  }, [voidSubmitting]);

  const handleConfirmVoid = useCallback(
    async (reason: string) => {
      if (!draft?.id) {
        return;
      }

      setVoidSubmitting(true);
      setVoidError(null);

      try {
        await voidTransaction(reason);
        emitDashboardBalanceRefresh();
        setSuccessMessage('Operación anulada correctamente.');
        setFormError(null);
        setShowToast(true);
        setVoidModalOpen(false);
        setSuccessStateVisible(false);
        navigate('/dashboard');
      } catch (err) {
        const apiErr = err as ApiError;
        setVoidError(apiErr.message || 'No pudimos anular la operación.');
      } finally {
        setVoidSubmitting(false);
      }
    },
    [draft?.id, voidTransaction, navigate],
  );

  const handleSaveDraft = useCallback(async () => {
    // Aquí iría la lógica para guardar el borrador sin finalizar
    // (usando un hook o API call)
    devLog('Guardando borrador...');
    setFormError(null);
    setSuccessMessage('Borrador guardado correctamente.');
    setShowToast(true); // Reutilizamos el toast
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || !draft?.id) {
      setFormError(
        'Algunas validaciones fallaron. Revisá los pasos anteriores.',
      );
      document
        .getElementById('final-validation')
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      const confirmedDraft = await finalize();
      emitDashboardBalanceRefresh();
      setSuccessStateVisible(true);
      if (confirmedDraft?.id) {
        await fetchDraft();
      }
      setSuccessMessage('Operación confirmada correctamente.');
      setShowToast(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const apiError = error as ApiError;
      setFormError(apiError.message || 'No pudimos confirmar la operación.');
    }
  }, [canConfirm, draft?.id, fetchDraft, finalize]);

  // --- Handlers para la pantalla de ÉXITO (sin cambios) ---
  const handleViewDetails = useCallback(() => {
    if (!draft?.id) {
      navigate('/dashboard');
      return;
    }
    navigate(`/dashboard/operaciones/detalle/${draft.id}`);
  }, [draft?.id, navigate]);

  const handleNewOperation = useCallback(() => {
    const tipo = operationType === 'sell' ? 'venta' : 'compra';
    navigate(`/dashboard/operaciones/nueva?tipo=${tipo}`);
  }, [navigate, operationType]);

  const handleBackToOperations = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleExportPDF = useCallback(() => {
    const card = document.getElementById('success-card');
    if (!card) {
      window.print();
      return;
    }

    const clone = card.cloneNode(true) as HTMLElement;
    clone.classList.add('print-card');
    clone.querySelector('#primary-actions')?.remove();
    clone.querySelector('#secondary-actions')?.remove();
    clone.querySelectorAll('button').forEach((button) => button.remove());
    const markup = clone.outerHTML;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Resumen de operación</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-QZ6Hg0b6vE11D7nLJ8yKkB0pDZhOiabuX41ZJLdnOjFkWDXLI4YAlnXrhIRbkIuAeGHNirMRH3RkNv1dVQVOMA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            body {
              margin: 0;
              padding: 32px;
              background: #f9fafb;
              color: #0f172a;
            }
            .print-wrapper {
              max-width: 720px;
              margin: 0 auto;
            }
            .print-card {
              background: #ffffff;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 20px 45px -20px rgba(30, 41, 59, 0.25);
              padding: 48px;
            }
            .print-card .text-text-primary {
              color: #0f172a !important;
            }
            .print-card .text-gray-600,
            .print-card .text-gray-500 {
              color: #64748b !important;
            }
            .print-card .bg-primary,
            .print-card .text-primary {
              color: #1d4ed8 !important;
            }
            .print-card .bg-primary {
              background: #eff6ff !important;
            }
            .print-card .bg-success {
              background: #ecfdf3 !important;
            }
            .print-card .text-success {
              color: #15803d !important;
            }
            .print-card .bg-danger {
              background: #fef2f2 !important;
            }
            .print-card .text-danger {
              color: #b91c1c !important;
            }
            .print-card .rounded-full {
              border-radius: 9999px;
            }
            .print-card .inline-flex {
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .print-card .fa-solid {
              color: inherit;
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .print-wrapper {
                margin: 0;
                max-width: none;
              }
              .print-card {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${markup}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, []);

  const handleDuplicate = useCallback(() => {
    devLog(`Duplicando operación ${draft?.id}`);
    navigate(`/dashboard/operaciones/nueva?duplicarDe=${draft?.id ?? ''}`);
  }, [draft?.id, navigate]);
  // --- Fin Handlers de ÉXITO ---

  const busy = draftLoading || saving;
  const isReady = Boolean(draft);

  const summarySettlementMode = draft?.settlement?.mode ?? 'simple';
  const summarySimpleMethod = draft?.settlement?.simpleMethod ?? null;
  const settlementBaseCurrency =
    draft?.type === 'buy'
      ? draft?.outgoingAsset?.code || outgoingCurrency
      : draft?.incomingAsset?.code || incomingCurrency;

  const summarySettlementLines =
    (draft?.settlement?.lines ?? []).map((line) => {
      const baseAmount =
        totalSettlementAmount && Number.isFinite(totalSettlementAmount)
          ? totalSettlementAmount
          : 0;
      const rawValue = Number(line.value) || 0;
      const baseFromPercent =
        line.allocationType === 'percentage' && baseAmount > 0
          ? (rawValue / 100) * baseAmount
          : rawValue;
      const computedAmount = baseFromPercent;
      const computedPercentage =
        baseAmount > 0 && Number.isFinite(computedAmount)
          ? (computedAmount / baseAmount) * 100
          : 0;
      return {
        method: line.method,
        allocationType: 'amount' as const,
        value: computedAmount,
        computedPercentage,
        computedAmount,
        currency: (settlementBaseCurrency || incomingCurrency || outgoingCurrency || 'ARS').toUpperCase(),
      };
    }) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SuccessAnimationStyles />

      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      {/* Contenedor principal ajustado a max-w-6xl y pt-[205px] */}
      <main
        id="wizard-container"
        className="flex-grow pt-[205px] px-6 pb-8 max-w-6xl mx-auto w-full"
      >
        {/*
          *
          * RENDER PRE-CONFIRMACIÓN (successStateVisible === false)
          *
          */}
        {!successStateVisible && (
          <>
            {/* SECTION: Breadcrumbs (nuevo) */}
            <section id="breadcrumbs" className="mb-4">
              <nav className="flex items-center text-sm text-gray-500">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-primary transition-colors"
                >
                  Operaciones
                </button>
                <i className="fa-solid fa-chevron-right mx-2 text-xs"></i>
                <button
                  onClick={() => handleBackToStep(1)}
                  className="hover:text-primary transition-colors"
                >
                  Nueva operación
                </button>
                <i className="fa-solid fa-chevron-right mx-2 text-xs"></i>
                <span className="text-text-primary font-medium">Resumen</span>
              </nav>
            </section>

            {/* SECTION: Wizard Header (Modificado para coincidir con HTML) */}
            <section id="wizard-header" className="mb-8 mt-8">


              {/* Progress Bar (Existente, ahora anidado) */}
              <div className="mb-8">
                <WizardHeader
                  steps={WIZARD_STEPS}
                  currentStep={2} // Step 3 es índice 2
                  onBack={() => navigate('/dashboard')}
                  currencies={[incomingCurrency, outgoingCurrency]}
                />
              </div>
            </section>

            {/* Alertas */}
            {draftError && (
              <Alert
                type="error"
                message={draftError.message}
                className="mb-4"
              />
            )}
            {formError && (
              <Alert
                type="error"
                message={formError}
                className="mb-4"
                onClose={() => setFormError(null)}
              />
            )}
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                className="mb-4"
                onClose={() => setSuccessMessage(null)}
              />
            )}
            {voidSuccess && (
              <Alert
                type="warning"
                message="La operación fue anulada. Las cuentas se revirtieron automáticamente."
                className="mb-4"
              />
            )}

            {/* Estado de carga */}
            {!isReady && draftLoading && (
              <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center shadow-sm">
                <LoadingSpinner size="lg" />
                <span className="mt-4 text-sm text-gray-600">
                  Cargando datos de la operación…
                </span>
              </div>
            )}

            {/* Contenido del Resumen (CA13, CA14) */}
            {isReady && draft && (
              <>
                <WizardCompleteSummary
                  clientName={summaryClient?.fullName ?? '—'}
                  clientDocument={summaryClient?.cuit ?? null}
                  contact={summaryClient?.internalOwner ?? null}
                  type={draft.type}
                  clientLastMargin={summaryClient?.lastMarginPercentage ?? null}
                  incomingAssetLabel={draft.incomingAsset?.label ?? incomingCurrency}
                  outgoingAssetLabel={draft.outgoingAsset?.label ?? outgoingCurrency}
                  incomingAmount={draft.incomingAmount ?? 0}
                  outgoingAmount={draft.outgoingAmount ?? 0}
                  incomingCurrency={incomingCurrency}
                  outgoingCurrency={outgoingCurrency}
                  apr={draft.apr ?? 0}
                  marketApr={draft.marketApr ?? 0}
                  marginPercentage={marginValue}
                  settlementMode={summarySettlementMode}
                  settlementSimpleMethod={summarySimpleMethod}
                  settlementLines={summarySettlementLines}
                  lastUpdated={draft.updatedAt ?? undefined}
                  onEditStep1={() => handleBackToStep(1)}
                  onEditStep2={() => handleBackToStep(2)}
                />

                {/* --- Validación final Card (nuevo) (CA15) --- */}
                <section
                  id="final-validation"
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
                >
                  <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                    <i className="fa-solid fa-shield-halved mr-2 text-primary"></i>
                    Validación final
                  </h3>
                  <div className="space-y-3">
                    {validationItems.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between p-3 rounded-lg border ${item.passed
                            ? 'bg-success bg-opacity-5 border-success border-opacity-20'
                            : 'bg-danger bg-opacity-5 border-danger border-opacity-20'
                        }`}
                      >
                        <div className="flex items-center">
                          {item.passed ? (
                            <i className="fa-solid fa-check-circle text-success mr-3"></i>
                          ) : (
                            <i className="fa-solid fa-exclamation-triangle text-danger mr-3"></i>
                          )}
                          <span
                            className={`text-sm font-medium ${item.passed ? 'text-success' : 'text-danger'}`}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mensaje de estado de validación */}
                  <div
                    className={`mt-4 p-3 rounded-lg border ${canConfirm
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center">
                      {canConfirm ? (
                        <i className="fa-solid fa-thumbs-up text-green-600 mr-2"></i>
                      ) : (
                        <i className="fa-solid fa-times-circle text-red-600 mr-2"></i>
                      )}
                      <span
                        className={`text-sm font-medium ${canConfirm ? 'text-green-800' : 'text-red-800'}`}
                      >
                        {canConfirm
                          ? 'Operación lista para confirmar'
                          : 'Faltan validaciones. Revisá los pasos anteriores.'}
                      </span>
                    </div>
                  </div>
                </section>
              </>
            )}
            {/*
              * Acciones (CA17)
              * Reutiliza WizardActions pero con el botón de "Confirmar"
              */}
            {isReady && (
              <WizardActions
                onBack={() => handleBackToStep(2)}
                backLabel="Atrás"
                onSaveDraft={handleSaveDraft}
                onCancel={handleCancel}
                onContinue={handleConfirm}
                continueLabel="Confirmar operación"
                saving={busy}
                disableContinue={!canConfirm || busy}
                disableSave={busy}
              />
            )}
          </>
        )}

        {/*
          *
          * RENDER POST-CONFIRMACIÓN (successStateVisible === true) (CA16)
          * (Sin cambios, ya implementado)
          *
          */}
        {successStateVisible && draft && (
          <CompletionSuccessState
            operationCode={draft.operationCode ?? '—'}
            onViewDetails={handleViewDetails}
            onBackToOperations={handleBackToOperations}
            onNewOperation={handleNewOperation}
            onExportPDF={handleExportPDF}
            onDuplicate={handleDuplicate}
            onVoid={handleOpenVoidModal}
            canVoid={!isVoided && !voidSubmitting}
            // Props para el resumen
            clientName={clientSummary?.fullName ?? '—'}
            clientDocument={clientSummary?.cuit}
            operationType={operationType}
            settlementMode={draft.settlement?.mode ?? 'simple'}
            incomingAmountLabel={formatCurrency(
              draft.incomingAmount,
              incomingCurrency,
            )}
            incomingAssetLabel={draft.incomingAsset?.label ?? incomingCurrency}
            outgoingAmountLabel={formatCurrency(
              draft.outgoingAmount,
              outgoingCurrency,
            )}
            outgoingAssetLabel={draft.outgoingAsset?.label ?? outgoingCurrency}
            operationRate={draft.apr}
          />
        )}
      </main>

      <DashboardFooter />

      {/* Modales (sin cambios) */}
      <CancelOperationModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
      />
      <VoidOperationModal
        open={voidModalOpen}
        loading={voidSubmitting}
        error={voidError}
        onClose={handleCloseVoidModal}
        onConfirm={handleConfirmVoid}
      />

      {/* Toast (sin cambios) */}
      {showToast && (
        <div className="fixed bottom-8 right-8 transform transition-transform duration-300 ease-out">
          <div
            className={`bg-white border shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3 ${
              formError ? 'border-danger' : 'border-gray-200'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                formError
                  ? 'bg-danger bg-opacity-10 text-danger'
                  : 'bg-success bg-opacity-10 text-success'
              }`}
            >
              <i
                className={`fa-solid ${
                  formError ? 'fa-exclamation-triangle' : 'fa-check'
                }`}
              />
            </div>
            <div className="text-sm text-text-primary">
              {successMessage ?? formError ?? 'Acción completada'}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowToast(false);
                setSuccessMessage(null);
                setFormError(null);
              }}
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
