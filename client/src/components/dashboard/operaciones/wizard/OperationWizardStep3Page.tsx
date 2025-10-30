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
// import { apiRequest, handleApiError } from '../../../../utils/api';
import { CompletionSuccessState } from './CompletionSuccessState';
import { CancelOperationModal } from './CancelOperationModal';
import { emitDashboardBalanceRefresh } from '../../../../utils';

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Información de la operación' },
  { label: 'Liquidación', description: 'Método de pago' },
  { label: 'Resumen', description: 'Confirmación final' },
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
const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0.00%';
  }
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

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

// Componente local para items de resumen (basado en wizardstep3.html)
const SummaryItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">
      {label}
    </label>
    <div className="text-text-primary font-medium">{children}</div>
  </div>
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

  const marginValue = draft?.marginPercentage ?? 0;
  const settlementPercentage =
    draft?.settlement?.totalPercentage ??
    (draft?.settlement?.mode === 'simple' ? 100 : 0);

  // Lógica de validación (CA15)
  const validationItems = useMemo(
    () => [
      {
        label: 'Cliente válido y con documentación vigente',
        passed: Boolean(clientSummary?.cuit),
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
        label: 'TC dentro de umbrales vs. mercado (±10%)',
        // Asumimos un umbral del 10% para el ejemplo
        passed:
          typeof marginValue === 'number' &&
          Number.isFinite(marginValue) &&
          Math.abs(marginValue) <= 10,
      },
      {
        label: 'Liquidación completa (100%)',
        passed:
          draft?.settlement?.mode === 'simple'
            ? Boolean(draft?.settlement?.simpleMethod)
            : Math.abs(settlementPercentage - 100) <= 0.1,
      },
    ],
    [
      clientSummary?.cuit,
      draft?.incomingAmount,
      draft?.outgoingAmount,
      draft?.apr,
      draft?.settlement?.mode,
      draft?.settlement?.simpleMethod,
      marginValue,
      settlementPercentage,
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

  const handleConfirmCancel = useCallback(() => {
    setCancelModalOpen(false);
    navigate('/dashboard');
  }, [navigate]);

  const handleSaveDraft = useCallback(async () => {
    // Aquí iría la lógica para guardar el borrador sin finalizar
    // (usando un hook o API call)
    console.log('Guardando borrador...');
    setFormError(null);
    setSuccessMessage('Borrador guardado correctamente.');
    setShowToast(true); // Reutilizamos el toast
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || !draft?.id) {
      setFormError(
        'Algunas validaciones fallaron. Revisá los pasos anteriores.',
      );
      // Scroll to validation card
      document
        .getElementById('final-validation')
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    try {
      const confirmedDraft = await finalize(); // Llama al hook para finalizar
      emitDashboardBalanceRefresh();
      // Redirige a la pantalla de detalle de la operación confirmada
      if (confirmedDraft?.id) {
        navigate(`/dashboard/operaciones/detalle/${confirmedDraft.id}`);
        return; // Evita seguir ejecutando código innecesario
      }
      // Si por alguna razón no hay id, mostramos el estado de éxito interno
      setSuccessMessage('Operación confirmada correctamente.');
      setSuccessStateVisible(true);
      await fetchDraft();
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
    // Exporta únicamente la tarjeta de éxito (o el contenido principal) a PDF
    const card = document.getElementById('success-card');

    // Si no encontramos la tarjeta, hacemos un print tradicional como respaldo
    if (!card) {
      window.print();
      return;
    }

    // Abrimos una nueva ventana emergente con solo el contenido relevante
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    // Construimos el HTML mínimo necesario, incluyendo los estilos de Tailwind y FontAwesome
    // Ajusta la ruta al CSS si tu app lo sirve en un path distinto en producción
    printWindow.document.write(`
      <html>
        <head>
          <title>Operación ${draft?.operationCode ?? ''}</title>
          <link rel="stylesheet" href="/index.css" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-aEcp2S5XpjHaX18U9BMRQPzEebNFKWvH6L37kiRmX5zVscxG59Oo1ZBa6g6kK0bkZ37N3/QkpB+X1uiGykNcZA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
          <style>
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body class="p-8">
          ${card.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, [draft?.operationCode]);

  const handleDuplicate = useCallback(() => {
    console.log(`Duplicando operación ${draft?.id}`);
    navigate(`/dashboard/operaciones/nueva?duplicarDe=${draft?.id ?? ''}`);
  }, [draft?.id, navigate]);
  // --- Fin Handlers de ÉXITO ---

  const busy = draftLoading || saving;
  const isReady = Boolean(draft);

  // Calcula el monto total para la liquidación
  const totalSettlementAmount =
    draft?.type === 'buy' ? draft?.outgoingAmount : draft?.incomingAmount;
  const totalSettlementCurrency =
    draft?.type === 'buy' ? outgoingCurrency : incomingCurrency;

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
              <section id="summary-content" className="space-y-6 mb-8">
                {/* --- Cliente Card (nuevo) --- */}
                <div
                  id="cliente-summary"
                  className="bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text-primary flex items-center">
                        <i className="fa-solid fa-user mr-2 text-primary"></i>
                        Cliente
                      </h3>
                      <button
                        className="flex items-center px-4 py-2 text-primary hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        onClick={() => handleBackToStep(1)}
                      >
                        <i className="fa-solid fa-edit mr-2"></i>
                        Editar
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <SummaryItem label="Nombre / Razón social">
                          {clientSummary?.fullName ?? '—'}
                        </SummaryItem>
                        <SummaryItem label="CUIT">
                          {clientSummary?.cuit ?? '—'}
                        </SummaryItem>
                      </div>
                      <div className="space-y-4">
                        <SummaryItem label="Responsable interno">
                          {clientSummary?.internalOwner ?? '—'}
                        </SummaryItem>
                        <SummaryItem label="Último margen con este cliente">
                          {clientSummary?.lastMarginPercentage ? (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                clientSummary.lastMarginPercentage > 0
                                  ? 'bg-success bg-opacity-10 text-success'
                                  : 'bg-danger bg-opacity-10 text-danger'
                              }`}
                            >
                              {clientSummary.lastMarginPercentage > 0 ? (
                                <i className="fa-solid fa-arrow-up mr-1"></i>
                              ) : (
                                <i className="fa-solid fa-arrow-down mr-1"></i>
                              )}
                              {formatPercentage(
                                clientSummary.lastMarginPercentage,
                              )}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </SummaryItem>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Operación Card (nuevo) --- */}
                <div
                  id="operacion-summary"
                  className="bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text-primary flex items-center">
                        <i className="fa-solid fa-exchange-alt mr-2 text-primary"></i>
                        Operación
                      </h3>
                      <button
                        className="flex items-center px-4 py-2 text-primary hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        onClick={() => handleBackToStep(1)}
                      >
                        <i className="fa-solid fa-edit mr-2"></i>
                        Editar
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <SummaryItem label="Tipo de operación">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              draft.type === 'buy'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {draft.type === 'buy' ? (
                              <i className="fa-solid fa-arrow-down mr-1"></i>
                            ) : (
                              <i className="fa-solid fa-arrow-up mr-1"></i>
                            )}
                            {draft.type === 'buy' ? 'Compra' : 'Venta'}
                          </span>
                        </SummaryItem>
                        <SummaryItem
                          label={
                            draft.type === 'buy'
                              ? 'Bien que entra'
                              : 'Bien que sale'
                          }
                        >
                          {`${formatCurrency(
                            draft.incomingAmount,
                            incomingCurrency,
                          )} (${draft.incomingAsset?.label ?? '—'})`}
                        </SummaryItem>
                        <SummaryItem
                          label={
                            draft.type === 'buy'
                              ? 'Bien que sale'
                              : 'Bien que entra'
                          }
                        >
                          {`${formatCurrency(
                            draft.outgoingAmount,
                            outgoingCurrency,
                          )} (${draft.outgoingAsset?.label ?? '—'})`}
                        </SummaryItem>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <SummaryItem label="TC Operación">
                            {`$${(draft.apr ?? 0).toFixed(2)}`}
                          </SummaryItem>
                          <SummaryItem label="TC de mercado">
                            {`$${(draft.marketApr ?? 0).toFixed(2)}`}
                          </SummaryItem>
                        </div>
                        <SummaryItem label="Margen estimado">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mr-2 ${
                                marginValue > 0
                                  ? 'bg-success bg-opacity-10 text-success'
                                  : 'bg-danger bg-opacity-10 text-danger'
                              }`}
                            >
                              {marginValue > 0 ? (
                                <i className="fa-solid fa-arrow-up mr-1"></i>
                              ) : (
                                <i className="fa-solid fa-arrow-down mr-1"></i>
                              )}
                              {formatPercentage(marginValue)}
                            </span>
                            <div className="relative group">
                              <i className="fa-solid fa-info-circle text-gray-400 hover:text-gray-600"></i>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                vs. TC de mercado
                              </div>
                            </div>
                          </div>
                        </SummaryItem>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Liquidación Card (nuevo) --- */}
                <div
                  id="liquidacion-summary"
                  className="bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-text-primary flex items-center">
                        <i className="fa-solid fa-credit-card mr-2 text-primary"></i>
                        Liquidación
                      </h3>
                      <button
                        className="flex items-center px-4 py-2 text-primary hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                        onClick={() => handleBackToStep(2)}
                      >
                        <i className="fa-solid fa-edit mr-2"></i>
                        Editar
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <SummaryItem label="Tipo de liquidación">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          <i
                            className={`fa-solid ${
                              draft.settlement?.mode === 'compound'
                                ? 'fa-layer-group'
                                : 'fa-stream'
                            } mr-1`}
                          />
                          {draft.settlement?.mode === 'compound'
                            ? 'Compuesta'
                            : 'Simple'}
                        </span>
                      </SummaryItem>

                      {draft.settlement?.mode === 'simple' && (
                        <SummaryItem label="Método de liquidación">
                          {draft.settlement.simpleMethod ?? '—'}
                        </SummaryItem>
                      )}

                      {draft.settlement?.mode === 'compound' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-3">
                            Detalle de liquidación
                          </label>
                          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 hidden md:block">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-sm font-medium text-gray-700">
                                  Método
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                  Monto
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                  Porcentaje
                                </div>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {(draft.settlement.lines ?? []).map(
                                (line, idx) => (
                                  <div key={idx} className="px-4 py-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div className="text-text-primary font-medium md:hidden">
                                        Método
                                      </div>
                                      <div className="text-text-primary">
                                        {line.method}
                                      </div>
                                      <div className="text-text-primary font-medium md:hidden mt-2">
                                        Monto
                                      </div>
                                      <div className="text-text-primary">
                                        {formatCurrency(
                                          (line.computedPercentage / 100) *
                                            (totalSettlementAmount ?? 0),
                                          totalSettlementCurrency,
                                        )}
                                      </div>
                                      <div className="text-text-primary font-medium md:hidden mt-2">
                                        Porcentaje
                                      </div>
                                      <div className="text-text-primary">
                                        {line.computedPercentage.toFixed(2)}%
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="px-4 py-3 bg-success bg-opacity-5 border-t border-gray-200 rounded-b-lg">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-sm font-semibold text-success">
                                  Total
                                </div>
                                <div className="text-sm font-semibold text-success">
                                  {formatCurrency(
                                    totalSettlementAmount ?? 0,
                                    totalSettlementCurrency,
                                  )}
                                </div>
                                <div className="text-sm font-semibold text-success">
                                  {settlementPercentage.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          item.passed
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
                            className={`text-sm font-medium ${
                              item.passed ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Mensaje de estado de validación */}
                  <div
                    className={`mt-4 p-3 rounded-lg border ${
                      canConfirm
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
                        className={`text-sm font-medium ${
                          canConfirm ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {canConfirm
                          ? 'Operación lista para confirmar'
                          : 'Faltan validaciones. Revisá los pasos anteriores.'}
                      </span>
                    </div>
                  </div>
                </section>
              </section>
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