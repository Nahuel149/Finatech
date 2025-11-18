import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  ClientSummary,
  TransactionType,
  TransactionDraftPayload,
} from '../../../../types';
import {
  useClientsList,
  useTransactionDraft,
  useLatestMarketRate,
} from '../../../../hooks/dashboard';
import { useUserPermissions } from '../../../../hooks';
import { apiRequest, handleApiError } from '../../../../utils/api';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { ClientSelection } from './ClientSelection';
import { OperationTypeSelector } from './OperationTypeSelector';
import { AssetSelection, AssetOption } from './AssetSelection';
import { ExchangeRatesSection } from './ExchangeRatesSection';
import { AmountSection } from './AmountSection';
import { MarginIndicator } from './MarginIndicator';
import { ValidationChecklist } from './ValidationChecklist';
import { WizardActions } from './WizardActions';
import { NewClientModal } from '../../../clients/NewClientModal';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { devLog } from '../../../../utils/devLogger';

const VALIDATION_ITEMS = [
  'TC dentro de límites establecidos',
  'Monto dentro de límites diarios',
  'Cliente con documentación vigente',
];

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Información de la operación' },
  { label: 'Liquidación', description: 'Método de pago' },
  { label: 'Resumen', description: 'Confirmación final' },
];

const OWNER_OPTIONS = ['Operaciones', 'Tesorería', 'Comercial', 'Backoffice'];

const ASSET_CATALOG: AssetOption[] = [
  { code: 'ARS', label: 'Pesos Argentinos (ARS)' },
  { code: 'USD', label: 'Dólares (USD)' },
  { code: 'EUR', label: 'Euros (EUR)' },
  { code: 'BRL', label: 'Reales (BRL)' },
];

const ASSET_DEFAULTS: Record<TransactionType, { incoming: string; outgoing: string }> = {
  buy: { incoming: 'USD', outgoing: 'ARS' },  // Compra: entra USD y sale ARS
  sell: { incoming: 'ARS', outgoing: 'USD' }, // Venta: entra ARS y sale USD
};

const formatMargin = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return undefined;
  }
  const formatted = value.toFixed(1);
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatted}%`;
};

const parseNotes = (notes?: string | null) => {
  if (!notes) {
    return null;
  }
  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed.secondaryAsset) {
      return {
        rate: Number(parsed.secondaryAsset.rate),
        marketRate: Number(parsed.secondaryAsset.marketRate),
      };
    }
  } catch {
    // ignore parsing errors
  }
  return null;
};

const encodeNotes = (rate: number, marketRate: number, code: string) =>
  JSON.stringify({
    secondaryAsset: {
      code,
      rate,
      marketRate,
    },
  });

const findClientLabel = (clients: ClientSummary[], clientId: string) =>
  clients.find((client) => client.id === clientId);

const findAssetLabel = (code: string) =>
  ASSET_CATALOG.find((asset) => asset.code === code)?.label || code;

const sanitizeNumber = (value: number) =>
  Number.isFinite(value) ? Number(value) : 0;

const RATES_EPSILON = 1e-6;
const ratesAreEqual = (first?: number | null, second?: number | null) => {
  if (first === null || first === undefined) {
    return second === null || second === undefined;
  }

  if (second === null || second === undefined) {
    return false;
  }

  return Math.abs(first - second) < RATES_EPSILON;
};

// Genera labels contextuales según las reglas de negocio
const getAmountLabels = (_operationType: TransactionType, incomingAsset: string, outgoingAsset: string) => ({
  enterLabel: `Bien que entra (${incomingAsset})`,
  exitLabel: `Bien que sale (${outgoingAsset})`,
});

export const OperationWizardStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const draftId = searchParams.get('draftId');
  const presetType = (searchParams.get('tipo') || '').toLowerCase();
  const initialOperationType: TransactionType =
    presetType === 'venta' ? 'sell' : 'buy';

  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [operationType, setOperationType] =
    useState<TransactionType>(initialOperationType);
  const [incomingAssetCode, setIncomingAssetCode] = useState<string>(
    ASSET_DEFAULTS[initialOperationType].incoming,
  );
  const [outgoingAssetCode, setOutgoingAssetCode] = useState<string>(
    ASSET_DEFAULTS[initialOperationType].outgoing,
  );
  const [apr, setApr] = useState<number>(833.5);
  const [marketApr, setMarketApr] = useState<number>(830.0);
  const [incomingAmount, setIncomingAmount] = useState<number>(operationType === 'buy' ? 150.0 : 125000.0);
  const [outgoingAmount, setOutgoingAmount] = useState<number>(operationType === 'buy' ? 125000.0 : 150.0);
  const [secondaryRate, setSecondaryRate] = useState<number>(1);
  const [secondaryMarketRate, setSecondaryMarketRate] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    setClients,
    search: searchClients,
  } = useClientsList(50);

  const {
    draft,
    loading: draftLoading,
    saving,
    error: draftError,
    saveDraft,
  } = useTransactionDraft(draftId);
  

  
  const { permissions } = useUserPermissions();
  const normalizedPermissions = useMemo(
    () =>
      permissions.map((permission) =>
        permission.trim().toLowerCase().replace(/\s+/g, '-')
      ),
    [permissions]
  );
  const canEditMarketRate = useMemo(
    () =>
      normalizedPermissions.some((permission) =>
        ['admin', 'tesoreria', 'tesorería', 'tesoreria-admin', 'manage-market-rates'].includes(
          permission
        )
      ),
    [normalizedPermissions]
  );
  const [useCustomMarketRate, setUseCustomMarketRate] = useState(false);
  const [autoMarketRate, setAutoMarketRate] = useState<number>(marketApr);
  const { data: latestMarketRate, refresh: refreshMarketRate } = useLatestMarketRate({
    baseAsset: 'USD',
    quoteAsset: 'ARS',
    enabled: canEditMarketRate && !useCustomMarketRate,
  });

  useEffect(() => {
    if (!canEditMarketRate && useCustomMarketRate) {
      setUseCustomMarketRate(false);

      if (Number.isFinite(autoMarketRate) && !ratesAreEqual(marketApr, autoMarketRate)) {
        setMarketApr(autoMarketRate);
      }
    }
  }, [autoMarketRate, canEditMarketRate, marketApr, useCustomMarketRate]);

  useEffect(() => {
    if (!latestMarketRate) {
      return;
    }

    const normalizedRate = Number(latestMarketRate.rate);
    if (!Number.isFinite(normalizedRate)) {
      return;
    }

    if (!ratesAreEqual(autoMarketRate, normalizedRate)) {
      setAutoMarketRate(normalizedRate);
    }

    if (!useCustomMarketRate && !ratesAreEqual(marketApr, normalizedRate)) {
      setMarketApr(normalizedRate);
    }
  }, [autoMarketRate, latestMarketRate, marketApr, useCustomMarketRate]);

  // Hydrate form with draft data when available
  useEffect(() => {
    if (!draft) {
      return;
    }

    devLog('Hydrating form with draft data - draft.clientId:', draft.clientId, 'current clientId:', clientId);
    
    // Only set state if the draft value is different from the current state
    if (draft.clientId && draft.clientId !== clientId) {
      setClientId(draft.clientId);
    }
    
    const normalizedType: TransactionType = draft.type === 'sell' ? 'sell' : 'buy';
    if (normalizedType !== operationType) {
      setOperationType(normalizedType);
    }
    
    const defaults = ASSET_DEFAULTS[normalizedType];
    const draftIncomingCode = draft.incomingAsset?.code || defaults.incoming;
    const draftOutgoingCode = draft.outgoingAsset?.code || defaults.outgoing;
    
    if (draftIncomingCode !== incomingAssetCode) {
      setIncomingAssetCode(draftIncomingCode);
    }
    if (draftOutgoingCode !== outgoingAssetCode) {
      setOutgoingAssetCode(draftOutgoingCode);
    }
    
    const draftApr = sanitizeNumber(draft.apr);
    const draftMarketApr = sanitizeNumber(draft.marketApr);
    const draftIncomingAmount = sanitizeNumber(draft.incomingAmount);
    
    if (draftApr !== apr) {
      setApr(draftApr);
    }
    if (!ratesAreEqual(draftMarketApr, marketApr)) {
      setMarketApr(draftMarketApr);
    }
    if (!ratesAreEqual(draftMarketApr, autoMarketRate)) {
      setAutoMarketRate(draftMarketApr);
    }
    if (draftIncomingAmount !== incomingAmount) {
      setIncomingAmount(draftIncomingAmount);
    }
    const metadata = parseNotes(draft.notes);
    if (metadata) {
      const draftSecondaryRate = sanitizeNumber(metadata.rate) || 1;
      const draftSecondaryMarketRate = sanitizeNumber(metadata.marketRate) || 1;
      
      if (draftSecondaryRate !== secondaryRate) {
        setSecondaryRate(draftSecondaryRate);
      }
      if (draftSecondaryMarketRate !== secondaryMarketRate) {
        setSecondaryMarketRate(draftSecondaryMarketRate);
      }
    }

    if (draft.client) {
      const clientToAdd = draft.client as ClientSummary;
      setClients((prev) => {
        const exists = prev.some((client) => client.id === clientToAdd.id);
        if (exists) {
          return prev;
        }
        return [clientToAdd, ...prev];
      });
    }
  // We intentionally omit setClients from deps to avoid unnecessary re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Keep outgoing amount in sync with incoming amount and APR
  useEffect(() => {
    if (apr <= 0) {
      setOutgoingAmount(0);
      return;
    }

    // For buy operations: USD -> ARS, so multiply by rate
    // For sell operations: ARS -> USD, so divide by rate
    const computed =
      operationType === 'buy'
        ? Number((incomingAmount * apr).toFixed(2))  // USD * (ARS/USD) = ARS
        : Number((incomingAmount / apr).toFixed(2)); // ARS / (ARS/USD) = USD

    setOutgoingAmount(Number.isFinite(computed) ? computed : 0);
  }, [incomingAmount, apr, operationType]);
  // When the preset type changes via query params (e.g. shortcuts)
  useEffect(() => {
    if (presetType === 'venta') {
      setOperationType('sell');
      setIncomingAssetCode(ASSET_DEFAULTS.sell.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.sell.outgoing);
      // Reset amounts for sell operation
      setIncomingAmount(125000.0); // ARS amount
      setOutgoingAmount(150.0); // USD amount
    } else if (presetType === 'compra') {
      setOperationType('buy');
      setIncomingAssetCode(ASSET_DEFAULTS.buy.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.buy.outgoing);
      // Reset amounts for buy operation
      setIncomingAmount(150.0); // USD amount
      setOutgoingAmount(125000.0); // ARS amount
    }
  }, [presetType, setOperationType, setIncomingAssetCode, setOutgoingAssetCode, setIncomingAmount, setOutgoingAmount]);

  useEffect(() => {
    const needsBuyCorrection =
      operationType === 'buy' && incomingAssetCode === 'ARS' && outgoingAssetCode !== 'ARS';
    const needsSellCorrection =
      operationType === 'sell' && outgoingAssetCode === 'ARS' && incomingAssetCode !== 'ARS';

    if (!needsBuyCorrection && !needsSellCorrection) {
      return;
    }

    const previousIncomingAmount = incomingAmount;
    const previousOutgoingAmount = outgoingAmount;

    if (needsBuyCorrection) {
      // Swap so the asset that entra is the foreign currency and the one that sale is ARS
      setIncomingAssetCode(outgoingAssetCode);
      setOutgoingAssetCode('ARS');
      setIncomingAmount(previousOutgoingAmount);
      setOutgoingAmount(previousIncomingAmount);
      return;
    }

    if (needsSellCorrection) {
      // Swap so the asset that entra is ARS and the one that sale is the foreign currency
      setIncomingAssetCode('ARS');
      setOutgoingAssetCode(incomingAssetCode);
      setIncomingAmount(previousOutgoingAmount);
      setOutgoingAmount(previousIncomingAmount);
    }
  }, [operationType, incomingAssetCode, outgoingAssetCode, incomingAmount, outgoingAmount]);

  const activeClient = useMemo(
    () => findClientLabel(clients, clientId) ?? draft?.client ?? null,
    [clients, clientId, draft],
  );

  const marginInfo = useMemo(
    () => formatMargin(activeClient?.lastMarginPercentage ?? null),
    [activeClient],
  );

  const assetLabels = useMemo(
    () => ({ enter: 'Bien que entra', exit: 'Bien que sale' }),
    [],
  );

  const amountLabels = useMemo(
    () => getAmountLabels(operationType, incomingAssetCode, outgoingAssetCode),
    [operationType, incomingAssetCode, outgoingAssetCode],
  );

  const showSecondaryRates = outgoingAssetCode !== 'USD';

  const effectiveMarketRate = useMemo(() => {
    if (showSecondaryRates && secondaryMarketRate && secondaryMarketRate !== 0) {
      // Double exchange: ARS ↔ USD ↔ bien2
      // Effective ARS/bien2 market rate = (ARS/USD) / (bien2/USD)
      return marketApr / secondaryMarketRate;
    }
    return marketApr;
  }, [marketApr, showSecondaryRates, secondaryMarketRate]);

  const marginPercent = useMemo(() => {
    if (!effectiveMarketRate || effectiveMarketRate === 0) {
      return 0;
    }
    if (!incomingAmount || !outgoingAmount) {
      return 0;
    }

    // Calcular t_operacion como ARS/bien2 según las reglas
    let operationRate: number;
    
    if (operationType === 'buy') {
      // Compra: t_operacion = ARS pagados por unidad del bien2
      // outgoingAmount (ARS) / incomingAmount (bien2) = ARS/bien2
      operationRate = outgoingAmount / incomingAmount;
    } else {
      // Venta: t_operacion = ARS recibidos por unidad del bien2
      // incomingAmount (ARS) / outgoingAmount (bien2) = ARS/bien2
      operationRate = incomingAmount / outgoingAmount;
    }

    // Aplicar la fórmula: margen = (t_mercado - t_operacion) / t_mercado
    return ((effectiveMarketRate - operationRate) / effectiveMarketRate) * 100;
  }, [incomingAmount, effectiveMarketRate, operationType, outgoingAmount]);

  const secondaryAssetLabel = useMemo(
    () => findAssetLabel(outgoingAssetCode),
    [outgoingAssetCode]
  );

  useEffect(() => {
    if (!showSecondaryRates) {
      setSecondaryRate(1);
      setSecondaryMarketRate(1);
    }
  }, [showSecondaryRates]);

  // Build payload function for auto-save
  const buildPayload = useCallback((): TransactionDraftPayload => {
    const secondaryCode = outgoingAssetCode;
    const notesPayload = showSecondaryRates
      ? encodeNotes(
          Number(secondaryRate),
          Number(secondaryMarketRate),
          secondaryCode,
        )
      : undefined;

    const payload: TransactionDraftPayload = {
      clientId,
      type: operationType,
      incomingAsset: {
        code: incomingAssetCode,
        label: findAssetLabel(incomingAssetCode),
      },
      outgoingAsset: {
        code: outgoingAssetCode,
        label: findAssetLabel(outgoingAssetCode),
      },
      apr: Number(apr),
      marketApr: Number(marketApr),
      incomingAmount: Number(incomingAmount),
      outgoingAmount: Number(outgoingAmount),
      notes: notesPayload,
    };
    return payload;
  }, [
    apr,
    clientId,
    incomingAmount,
    incomingAssetCode,
    marketApr,
    operationType,
    outgoingAmount,
    outgoingAssetCode,
    secondaryMarketRate,
    secondaryRate,
    showSecondaryRates,
  ]);

  // Auto-save draft effect removed
  const handleOperationTypeChange = useCallback(
    (type: TransactionType) => {
      setOperationType(type);
      setIncomingAssetCode(ASSET_DEFAULTS[type].incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS[type].outgoing);
      // Don't swap amounts when changing operation type to prevent accumulation
      // The useEffect will recalculate the outgoing amount based on the new operation type
    },
    [],
  );

  const handleClientChange = useCallback((newClientId: string) => {
    // If ClientSelection sends undefined or null,
    // default it back to an empty string to match the initial state.
    // This prevents the state from changing and breaks the re-render loop.
    setClientId(newClientId ?? '');
  }, []);

  const handleToggleMarketRateMode = useCallback(
    (enabled: boolean) => {
      setUseCustomMarketRate(enabled);
      if (!enabled) {
        const fallbackRate = Number.isFinite(autoMarketRate)
          ? autoMarketRate
          : marketApr;

        if (!ratesAreEqual(marketApr, fallbackRate)) {
          setMarketApr(fallbackRate);
        }
        refreshMarketRate().catch(() => {});
      }
    },
    [autoMarketRate, marketApr, refreshMarketRate],
  );

  const handleNewClientCreated = useCallback(
     (client: ClientSummary) => {
       setClients((prev) => [client, ...prev.filter((item) => item.id !== client.id)]);
       setClientId(client.id);
       setIsNewClientModalOpen(false);
     },
     // eslint-disable-next-line react-hooks/exhaustive-deps
     [],
   );
  
  const handleOpenNewClientModal = useCallback(() => {
    setIsNewClientModalOpen(true);
  }, []);
  
  const handleCloseNewClientModal = useCallback(() => {
    setIsNewClientModalOpen(false);
  }, []);
  
  const validateForm = useCallback(() => {
    devLog('validateForm - clientId:', clientId, 'type:', typeof clientId);
    if (!clientId) {
      setFormError('Seleccioná un cliente antes de continuar.');
      return false;
    }
    if (!Number.isFinite(apr) || apr <= 0) {
      setFormError('El TC contra USD debe ser mayor a 0.');
      return false;
    }
    if (!Number.isFinite(marketApr) || marketApr <= 0) {
      setFormError('El TC de mercado debe ser mayor a 0.');
      return false;
    }
    if (!Number.isFinite(incomingAmount) || incomingAmount <= 0) {
      setFormError('El monto de entrada debe ser mayor a 0.');
      return false;
    }
    setFormError(null);
    return true;
  }, [apr, clientId, incomingAmount, marketApr]);

  const executeSave = useCallback(
    async (navigateToNext: boolean) => {
      try {
        const payload = buildPayload();
        const savedDraft = await saveDraft(payload);

        if (useCustomMarketRate && canEditMarketRate) {
          try {
            await apiRequest('/api/rates/market', {
              method: 'PUT',
              body: {
                baseAsset: 'USD',
                quoteAsset: 'ARS',
                rate: Number(marketApr),
                validFrom: new Date().toISOString(),
                source: 'MANUAL',
              },
            });
          } catch (err) {
            const apiError = handleApiError(err);
            setFormError(apiError.message || 'No pudimos registrar la tasa personalizada.');
            return;
          }
        }

        if (navigateToNext) {
          setSuccessMessage('Datos guardados. Continuando al siguiente paso...');
        } else {
          setSuccessMessage('Borrador guardado correctamente.');
        }
        setFormError(null);

        if (navigateToNext && savedDraft?.id) {
          navigate(
            `/dashboard/operaciones/nueva/liquidacion?draftId=${savedDraft.id}&tipo=${
              savedDraft.type === 'sell' ? 'venta' : 'compra'
            }`,
          );
        }
      } catch (error) {
        const apiError = error as ApiError;
        setFormError(apiError.message || 'Ocurrió un error al guardar la operación.');
      }
    },
    [
      buildPayload,
      saveDraft,
      useCustomMarketRate,
      canEditMarketRate,
      marketApr,
      setFormError,
      setSuccessMessage,
      navigate,
    ],
  );

  const [isExecuting, setIsExecuting] = useState(false);

  const handleSaveDraft = useCallback(async () => {
    if (isExecuting) return;
    
    // Validate form first, before setting executing state
    if (!validateForm()) {
      return;
    }
    
    setIsExecuting(true);
    try {
      await executeSave(false);
    } finally {
      setIsExecuting(false);
    }
  }, [executeSave, isExecuting, validateForm]);
  
  const handleContinue = useCallback(async () => {
    if (isExecuting) return;
    
    // Validate form first, before setting executing state
    if (!validateForm()) {
      return;
    }
    
    setIsExecuting(true);
    try {
      await executeSave(true);
    } finally {
      setIsExecuting(false);
    }
  }, [executeSave, isExecuting, validateForm]);
  
  const handleCancel = useCallback(() => navigate('/dashboard'), [navigate]);

  const busy = draftLoading || saving || isExecuting;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="flex-grow pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-8 max-w-6xl mx-auto overflow-x-hidden lg:overflow-x-visible">
        <WizardHeader
          steps={WIZARD_STEPS}
          currentStep={0}
          onBack={() => navigate('/dashboard')}
        />

        {(formError || draftError || clientsError) && (
          <Alert
            type="error"
            message={
              formError ||
              draftError?.message ||
              clientsError?.message ||
              'Ocurrió un error desconocido.'
            }
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

        <section
          id="step-1-data"
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 lg:p-8"
        >
          {busy && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex flex-col items-center justify-center rounded-lg">
              <LoadingSpinner size="lg" />
              <span className="text-sm text-gray-600 mt-3">Guardando cambios…</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div>
              <ClientSelection
                value={clientId}
                onChange={handleClientChange}
                clients={clients}
                onNewClient={handleOpenNewClientModal}
                onSearch={searchClients}
                marginInfo={marginInfo}
                loading={clientsLoading}
                error={clientsError?.message || null}
              />

              <OperationTypeSelector
                value={operationType}
                onChange={handleOperationTypeChange}
                disabled={busy}
              />

              <AssetSelection
                enterValue={incomingAssetCode}
                exitValue={outgoingAssetCode}
                enterOptions={ASSET_CATALOG}
                exitOptions={ASSET_CATALOG}
                onEnterChange={setIncomingAssetCode}
                onExitChange={setOutgoingAssetCode}
                enterLabel={assetLabels.enter}
                exitLabel={assetLabels.exit}
                disabled={busy}
              />

            </div>

            <div>
              <ExchangeRatesSection
                arsRate={apr}
                onArsRateChange={setApr}
                arsMarketRate={marketApr}
                onArsMarketRateChange={setMarketApr}
                assetRate={secondaryRate}
                onAssetRateChange={setSecondaryRate}
                assetMarketRate={secondaryMarketRate}
                assetLabel={secondaryAssetLabel}
                showSecondaryRates={showSecondaryRates}
                canEditMarketRate={canEditMarketRate}
                useCustomMarketRate={useCustomMarketRate}
                onToggleMarketRateMode={handleToggleMarketRateMode}
                disabled={busy}
              />
              <AmountSection
                enterAmount={incomingAmount}
                onEnterAmountChange={setIncomingAmount}
                exitAmount={outgoingAmount}
                enterLabel={amountLabels.enterLabel}
                exitLabel={amountLabels.exitLabel}
                disabled={busy}
              />
              <MarginIndicator
                marginPercent={marginPercent}
                marketRate={effectiveMarketRate}
                operationType={operationType}
                loading={busy}
              />
              <ValidationChecklist items={VALIDATION_ITEMS} loading={busy} />
            </div>
          </div>

          <WizardActions
            onSaveDraft={handleSaveDraft}
            onCancel={handleCancel}
            onContinue={handleContinue}
            saving={busy}
            disableContinue={busy}
            disableSave={busy}
          />
        </section>
      </main>

      <DashboardFooter />

      <NewClientModal
        open={isNewClientModalOpen}
        onClose={handleCloseNewClientModal}
        onCreated={handleNewClientCreated}
        defaultType="client"
        ownerOptions={OWNER_OPTIONS}
        defaultOwner="Operaciones"
      />
    </div>
  );
};
