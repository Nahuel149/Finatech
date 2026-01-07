import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  TransactionType,
  TransactionSettlementPayload,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
} from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { OperationSummary } from './OperationSummary';
import { SettlementMode, SettlementModeSelector } from './SettlementModeSelector';
import { SimpleSettlementForm } from './SimpleSettlementForm';
import {
  CompoundSettlementForm,
  CompoundLine,
  CompoundComputed,
} from './CompoundSettlementForm';
import { SettlementProgress } from './SettlementProgress';
import { WizardActions } from './WizardActions';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { ArsPositionAside } from './ArsPositionAside';
import { api } from '../../../../utils';

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Información' },
  { label: 'Liquidación', description: 'Pago' },
  { label: 'Resumen', description: 'Confirmar' },
];

const SETTLEMENT_METHODS = ['Efectivo', 'Transferencia', 'Depósito en banco'];
const DEFAULT_SIMPLE_METHOD = SETTLEMENT_METHODS[0];
const createCompoundLine = (method: string = ''): CompoundLine => ({
  id: `line-${Math.random().toString(36).slice(2, 9)}`,
  method,
  allocationType: 'amount',
  value: null,
});

const formatCurrency = (value: number, currency?: string) => {
  if (!Number.isFinite(value)) {
    return '0,00';
  }

  if (currency) {
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(value);
    } catch (error) {
      // fall through to generic formatter
    }
  }

  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const OperationWizardStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const draftId = searchParams.get('draftId');
  const presetTypeParam = (searchParams.get('tipo') || '').toLowerCase();

  const {
    draft,
    loading: draftLoading,
    saving,
    error: draftError,
    updateSettlement,
    advanceStep,
  } = useTransactionDraft(draftId);

  const { clients, setClients } = useClientsList(50);

  const [search, setSearch] = useState('');
  const [operationType, setOperationType] = useState<TransactionType>('buy');
  const [clientId, setClientId] = useState<string>('');
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('simple');
  const [simpleMethod, setSimpleMethod] = useState<string>(DEFAULT_SIMPLE_METHOD);
  const [compoundLines, setCompoundLines] = useState<CompoundLine[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  // Build payload function for auto-save
  // const buildPayload = useCallback((): TransactionSettlementPayload => {
  //   return settlementMode === 'simple'
  //     ? {
  //         mode: 'simple',
  //         simpleMethod,
  //       }
  //     : {
  //         mode: 'compound',
  //         lines: compoundLines.map((line) => ({
  //           method: line.method,
  //           allocationType: line.allocationType,
  //           value: Number(line.value),
  //         })),
  //       };
  // }, [settlementMode, simpleMethod, compoundLines]);

  useEffect(() => {
    if (draft) {
      const normalizedType: TransactionType = draft.type === 'sell' ? 'sell' : 'buy';
      if (normalizedType !== operationType) {
        setOperationType(normalizedType);
      }
      
      const newClientId = draft.clientId ?? '';
      if (newClientId !== clientId) {
        setClientId(newClientId);
      }
      
      const newMode = draft.settlement?.mode ?? 'simple';
      if (newMode !== settlementMode) {
        setSettlementMode(newMode);
      }
      
      const newMethod = draft.settlement?.simpleMethod || DEFAULT_SIMPLE_METHOD;
      if (newMethod !== simpleMethod) {
        setSimpleMethod(newMethod);
      }

      if (draft.settlement?.mode === 'compound' && draft.settlement.lines.length > 0) {
        const newCompoundLines: CompoundLine[] = draft.settlement.lines.map((line, index) => {
          const numericValue = Number(line.value);
          const allocationType =
            line.allocationType === 'percentage' ? 'percentage' : 'amount';
          return {
            id: `line-${index}-${Math.random().toString(36).slice(2, 7)}`,
            method: line.method,
            allocationType,
            value: Number.isFinite(numericValue) ? numericValue : null,
          };
        });
        
        // Only update if the structure has changed (simplified comparison)
        if (compoundLines.length !== newCompoundLines.length || 
            compoundLines.some((line, index) => 
              !newCompoundLines[index] || 
              line.method !== newCompoundLines[index].method ||
              line.value !== newCompoundLines[index].value
            )) {
          setCompoundLines(newCompoundLines);
        }
      } else if (draft.settlement?.mode !== 'compound' && compoundLines.length > 0) {
        // Only clear compound lines if the draft mode is not compound
        // This prevents clearing when user switches to compound mode but draft hasn't been saved yet
        setCompoundLines([]);
      }

      if (draft.client) {
        const clientToAdd = draft.client;
        setClients((prev) => {
          const exists = prev.some((client) => client.id === clientToAdd.id);
          if (exists) {
            return prev;
          }
          return [clientToAdd, ...prev];
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (presetTypeParam === 'venta') {
      setOperationType('sell');
    } else if (presetTypeParam === 'compra') {
      setOperationType('buy');
    }
  }, [presetTypeParam]);



  const incomingAmount = draft?.incomingAmount ?? 0;
  const outgoingAmount = draft?.outgoingAmount ?? 0;
  const incomingCurrency = draft?.incomingAsset?.code ?? 'ARS';
  const outgoingCurrency = draft?.outgoingAsset?.code ?? 'USD';

  // CAMBIO: La liquidación se basa en el monto ARS
  const baseAmount = operationType === 'buy' ? outgoingAmount : incomingAmount;
  const baseCurrency = operationType === 'buy' ? outgoingCurrency : incomingCurrency;

  const formatAmount = useCallback(
    (amount: number) => `${formatCurrency(amount, baseCurrency)} ${baseCurrency}`,
    [baseCurrency],
  );

  const computedLines = useMemo(() => {
    const result: Record<string, CompoundComputed> = {};
    const safeBase = baseAmount > 0 ? baseAmount : 0;

    compoundLines.forEach((line) => {
      const rawValue = typeof line.value === 'number' ? line.value : Number(line.value);
      const allocationType = line.allocationType === 'percentage' ? 'percentage' : 'amount';
      const normalizedValue = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
      const amount =
        allocationType === 'percentage' && safeBase > 0
          ? (normalizedValue / 100) * safeBase
          : normalizedValue;
      const percentage = safeBase > 0 ? (amount / safeBase) * 100 : 0;

      result[line.id] = {
        percentage: Number.isFinite(percentage) ? percentage : 0,
        amount: Number.isFinite(amount) ? amount : 0,
      };
    });

    return result;
  }, [baseAmount, compoundLines]);

  const totalAmountAllocated = useMemo(() => {
    return compoundLines.reduce((acc, line) => {
      const info = computedLines[line.id];
      return acc + (info ? info.amount : 0);
    }, 0);
  }, [compoundLines, computedLines]);

  const remainingAmount = Math.max(baseAmount - totalAmountAllocated, 0);
  const excessAmount = Math.max(totalAmountAllocated - baseAmount, 0);
  const completionTolerance = baseAmount > 0 ? Math.max(baseAmount * 0.0001, 0.01) : 0;
  const isCompoundComplete =
    baseAmount > 0 && Math.abs(totalAmountAllocated - baseAmount) <= completionTolerance;
  const hasCompoundLines = compoundLines.length > 0;

  const progressTone = !hasCompoundLines
    ? 'neutral'
    : excessAmount > 0
    ? 'error'
    : isCompoundComplete
    ? 'success'
    : 'neutral';

  const operationLabel = useMemo(() => {
    if (operationType === 'buy') {
      return `Compra ${draft?.incomingAsset?.code ?? ''}`.trim();
    }
    return `Venta ${draft?.outgoingAsset?.code ?? ''}`.trim();
  }, [draft?.incomingAsset?.code, draft?.outgoingAsset?.code, operationType]);

  const totalLabel = formatAmount(baseAmount);
  const amountDetails = useMemo(
    () => ([
      {
        label: `Recibe (${incomingCurrency})`,
        value: formatCurrency(incomingAmount, incomingCurrency),
      },
      {
        label: `Paga (${outgoingCurrency})`,
        value: formatCurrency(outgoingAmount, outgoingCurrency),
      },
    ]),
    [incomingAmount, incomingCurrency, outgoingAmount, outgoingCurrency],
  );

  const progressMessage = !hasCompoundLines
    ? 'Ingresa los metodos de liquidacion con sus montos.'
    : isCompoundComplete
    ? 'Listo, la liquidacion cubre el total acordado.'
    : excessAmount > 0
    ? `Te excediste en ${formatAmount(excessAmount)}. Ajusta los montos.`
    : `Restan ${formatAmount(remainingAmount)} para completar ${totalLabel}.`;

  const clientName = useMemo(() => {
    if (draft?.client?.fullName) {
      return draft.client.fullName;
    }
    const fallback = clients.find((client) => client.id === clientId);
    return fallback?.fullName ?? '—';
  }, [clientId, clients, draft?.client]);

  const handleModeChange = useCallback(
    (mode: SettlementMode) => {
      setSettlementMode(mode);
      if (mode === 'compound' && compoundLines.length === 0) {
        setCompoundLines([createCompoundLine(SETTLEMENT_METHODS[0])]);
      }
      setFormError(null);
      setSuccessMessage(null);
    },
    [compoundLines.length],
  );

  const handleSimpleMethodChange = useCallback((method: string) => {
    setSimpleMethod(method);
    setFormError(null);
  }, []);

  const handleLineChange = useCallback(
    (id: string, changes: Partial<CompoundLine>) => {
      setCompoundLines((prev) =>
        prev.map((line) => (line.id === id ? { ...line, ...changes } : line)),
      );
    },
    [],
  );

  const handleRemoveLine = useCallback((id: string) => {
    setCompoundLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const handleAddLine = useCallback(() => {
    setCompoundLines((prev) => [...prev, createCompoundLine(SETTLEMENT_METHODS[0])]);
  }, []);

  const validateCompound = useCallback(() => {
    if (!hasCompoundLines) {
      setFormError('Agregá al menos un método de liquidación.');
      return false;
    }

    for (const line of compoundLines) {
      if (!line.method) {
        setFormError('Completá el método en cada fila.');
        return false;
      }
      const numericValue = Number(line.value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        setFormError('Los valores deben ser mayores a cero.');
        return false;
      }
    }

    if (!isCompoundComplete) {
      setFormError('Necesitas asignar el total del monto de la operacion.');
      return false;
    }

    setFormError(null);
    return true;
  }, [compoundLines, hasCompoundLines, isCompoundComplete]);

  const handleSubmit = useCallback(
    async (navigateToSummary: boolean) => {
      if (!draft?.id) {
        setFormError('No encontramos el borrador de la operación.');
        return;
      }

      setSuccessMessage(null);

      if (settlementMode === 'simple') {
        if (!simpleMethod) {
          setFormError('Seleccioná un método de liquidación.');
          return;
        }
      } else if (!validateCompound()) {
        return;
      }

      const payload: TransactionSettlementPayload =
        settlementMode === 'simple'
          ? {
              mode: 'simple',
              simpleMethod,
            }
          : {
              mode: 'compound',
              lines: compoundLines.map((line) => ({
                method: line.method,
                allocationType: line.allocationType,
                value: Number(line.value),
              })),
            };

      try {
        const updated = await updateSettlement(payload);
        setFormError(null);
        
        if (navigateToSummary) {
          setSuccessMessage('Liquidación guardada. Continuando al resumen...');
        } else {
          setSuccessMessage('Liquidación guardada correctamente.');
        }

        if (navigateToSummary && updated?.id) {
          await advanceStep(3);
          navigate(
            `/dashboard/operaciones/nueva/resumen?draftId=${updated.id}&tipo=${
              updated.type === 'sell' ? 'venta' : 'compra'
            }`,
          );
        }
      } catch (error) {
        const apiError = error as ApiError;
        setFormError(apiError.message || 'No pudimos guardar la liquidación.');
      }
    },
    [advanceStep, compoundLines, draft?.id, navigate, settlementMode, simpleMethod, updateSettlement, validateCompound],
  );

  const handleBack = useCallback(() => {
    const tipo = operationType === 'sell' ? 'venta' : 'compra';
    const targetDraftId = draft?.id ?? draftId ?? '';
    navigate(`/dashboard/operaciones/nueva?draftId=${targetDraftId}&tipo=${tipo}`);
  }, [draft?.id, draftId, navigate, operationType]);

  const handleCancel = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleSaveDraft = useCallback(() => handleSubmit(false), [handleSubmit]);
  
  const handleContinue = useCallback(() => {
    // handleSubmit(true) already validates and saves the final data.
    // No need for additional forceSave or delay logic.
    handleSubmit(true);
  }, [handleSubmit]);

  // ----- Draft impact publishing (live aside) -----
  const [draftPublishWarning, setDraftPublishWarning] = useState<string | null>(null);

  const publishDraftImpact = useCallback(
    async (impacts: { cash: number; transfers: number; usd: number }) => {
      if (!draft?.id) return;
      try {
        await api.publishDraftImpact({
          draftId: draft.id,
          impacts,
          marginPercent: draft?.marginPercentage ?? null,
          marginWeightArs:
            baseCurrency === 'ARS'
              ? Math.abs(operationType === 'buy' ? outgoingAmount : incomingAmount)
              : 0,
        });
        setDraftPublishWarning(null);
      } catch {
        setDraftPublishWarning('No pudimos publicar el impacto en vivo. Se mostrará al guardar.');
      }
    },
    [baseCurrency, draft?.id, draft?.marginPercentage, incomingAmount, operationType, outgoingAmount]
  );

  const removeDraftImpact = useCallback(async () => {
    if (!draft?.id) return;
    try {
      await api.removeDraftImpact(draft.id);
    } catch {
      // ignore
    }
  }, [draft?.id]);

  useEffect(() => {
    if (!draft?.id) return undefined;
    if (baseAmount <= 0) return undefined;

    const impacts = { cash: 0, transfers: 0, usd: 0 };
    const arsDirection = operationType === 'buy' ? -1 : 1;

    // USD leg
    if (incomingCurrency === 'USD') {
      impacts.usd += incomingAmount;
    }
    if (outgoingCurrency === 'USD') {
      impacts.usd -= outgoingAmount;
    }

    // ARS leg
    const pushToBucket = (method: string, amount: number) => {
      const normalized = (method || '').toLowerCase();
      const isCash = normalized.includes('efectivo');
      if (isCash) {
        impacts.cash += amount;
      } else {
        impacts.transfers += amount;
      }
    };

    if (settlementMode === 'simple') {
      pushToBucket(simpleMethod, arsDirection * baseAmount);
    } else {
      compoundLines.forEach((line) => {
        const info = computedLines[line.id];
        const rawValue =
          info && Number.isFinite(info.amount) ? info.amount : Number(line.value) || 0;
        if (!rawValue) return;
        pushToBucket(line.method, arsDirection * rawValue);
      });
    }

    publishDraftImpact(impacts);

    return () => {
      removeDraftImpact();
    };
  }, [
    baseAmount,
    compoundLines,
    computedLines,
    draft?.id,
    incomingAmount,
    incomingCurrency,
    operationType,
    outgoingAmount,
    outgoingCurrency,
    publishDraftImpact,
    removeDraftImpact,
    settlementMode,
    simpleMethod,
  ]);

  const busy = draftLoading || saving;
  const isReady = Boolean(draft);

  const hasValidCompoundValues = compoundLines.every((line) => {
    const numericValue = Number(line.value);
    return line.method && Number.isFinite(numericValue) && numericValue > 0;
  });

  const canContinue = settlementMode === 'simple'
    ? Boolean(simpleMethod)
    : hasCompoundLines && hasValidCompoundValues && isCompoundComplete;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="flex-grow pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-8 max-w-6xl mx-auto overflow-x-hidden lg:overflow-x-visible">
        <WizardHeader
          steps={WIZARD_STEPS}
          currentStep={1}
          onBack={() => navigate('/dashboard')}
          currencies={[incomingCurrency, outgoingCurrency]}
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
        {!isReady && !draftLoading && !draftError && (
          <Alert
            type="info"
            message="Guardá primero los datos del paso de operación para configurar la liquidación."
            className="mb-4"
          />
        )}

        {!isReady && draftLoading && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center shadow-sm">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-sm text-gray-600">Cargando información de la operación…</span>
          </div>
        )}

        {isReady && (
          <section
            id="step-2-settlement"
            className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 lg:p-8"
          >
            {busy && (
              <div className="absolute inset-0 bg-white bg-opacity-65 z-10 flex flex-col items-center justify-center rounded-lg">
                <LoadingSpinner size="lg" />
                <span className="text-sm text-gray-600 mt-3">Guardando cambios…</span>
              </div>
            )}

          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
            <div className="flex-1 space-y-6">
              <OperationSummary
                clientName={clientName}
                operationLabel={operationLabel}
                amountLabel={totalLabel}
                amountDetails={amountDetails}
                  onEdit={handleBack}
                />

                <SettlementModeSelector
                  mode={settlementMode}
                  onChange={handleModeChange}
                  disabled={busy}
                />

                {settlementMode === 'simple' ? (
                  <SimpleSettlementForm
                    methods={SETTLEMENT_METHODS}
                    selectedMethod={simpleMethod}
                    onMethodChange={handleSimpleMethodChange}
                    totalLabel={totalLabel}
                    disabled={busy}
                  />
                ) : (
                  <>
                    <CompoundSettlementForm
                      lines={compoundLines}
                      computed={computedLines}
                      methods={SETTLEMENT_METHODS}
                      onLineChange={handleLineChange}
                      onRemoveLine={handleRemoveLine}
                      onAddLine={handleAddLine}
                      baseCurrencyLabel={totalLabel}
                      disabled={busy}
                      formatAmount={(amount) => `${formatCurrency(amount, baseCurrency)} ${baseCurrency}`}
                    />
                    <SettlementProgress
                      allocatedAmount={totalAmountAllocated}
                      targetAmount={baseAmount}
                      message={progressMessage}
                      tone={progressTone}
                      formatAmount={formatAmount}
                    />
                  </>
                )}
              </div>

              <ArsPositionAside
                incomingAmount={incomingAmount}
                outgoingAmount={outgoingAmount}
                incomingCurrency={incomingCurrency}
                outgoingCurrency={outgoingCurrency}
                apr={draft?.apr ?? null}
                currentMarginPercent={draft?.marginPercentage ?? null}
                settlementMode={settlementMode}
                simpleMethod={simpleMethod}
                compoundLines={compoundLines}
                computedLines={computedLines}
                baseAmount={baseAmount}
                baseCurrency={baseCurrency}
                operationType={operationType}
              />

              {draftPublishWarning && (
                <Alert
                  type="warning"
                  message={draftPublishWarning}
                  className="mt-4"
                  onClose={() => setDraftPublishWarning(null)}
                />
              )}
            </div>

            <WizardActions
              onBack={handleBack}
              onSaveDraft={handleSaveDraft}
              onCancel={handleCancel}
              onContinue={handleContinue}
              saving={busy}
              disableContinue={!canContinue || busy}
              disableSave={!canContinue || busy}
            />
          </section>
        )}
      </main>

      <DashboardFooter />
    </div>
  );
};
