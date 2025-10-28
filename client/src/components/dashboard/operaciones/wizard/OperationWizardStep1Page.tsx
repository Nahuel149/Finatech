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

const ASSET_CATALOG: AssetOption[] = [
  { code: 'ARS', label: 'Pesos Argentinos (ARS)' },
  { code: 'USD', label: 'Dólares (USD)' },
  { code: 'EUR', label: 'Euros (EUR)' },
  { code: 'BRL', label: 'Reales (BRL)' },
];

const ASSET_DEFAULTS: Record<TransactionType, { incoming: string; outgoing: string }> = {
  buy: { incoming: 'USD', outgoing: 'ARS' },
  sell: { incoming: 'ARS', outgoing: 'USD' },
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
  } = useClientsList(50);

  const {
    draft,
    loading: draftLoading,
    saving,
    error: draftError,
    saveDraft,
    advanceStep,
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
      setMarketApr(autoMarketRate);
    }
  }, [autoMarketRate, canEditMarketRate, useCustomMarketRate]);

  useEffect(() => {
    if (!useCustomMarketRate && latestMarketRate?.rate) {
      setMarketApr(latestMarketRate.rate);
    }
  }, [latestMarketRate, useCustomMarketRate]);

  // Hydrate form with draft data when available
  useEffect(() => {
    if (!draft) {
      return;
    }

    setClientId(draft.clientId ?? '');
    const normalizedType: TransactionType = draft.type === 'sell' ? 'sell' : 'buy';
    setOperationType(normalizedType);
    const defaults = ASSET_DEFAULTS[normalizedType];
    setIncomingAssetCode(draft.incomingAsset?.code || defaults.incoming);
    setOutgoingAssetCode(draft.outgoingAsset?.code || defaults.outgoing);
    setApr(sanitizeNumber(draft.apr));
    setMarketApr(sanitizeNumber(draft.marketApr));
    setAutoMarketRate(sanitizeNumber(draft.marketApr));
    setIncomingAmount(sanitizeNumber(draft.incomingAmount));
    setOutgoingAmount(sanitizeNumber(draft.outgoingAmount));

    const metadata = parseNotes(draft.notes);
    if (metadata) {
      setSecondaryRate(sanitizeNumber(metadata.rate) || 1);
      setSecondaryMarketRate(sanitizeNumber(metadata.marketRate) || 1);
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
  }, [draft, setClients]);

  // Keep outgoing amount in sync with incoming amount and APR
  useEffect(() => {
    if (apr <= 0) {
      setOutgoingAmount(0);
      return;
    }

    const computed =
      operationType === 'buy'
        ? Number((incomingAmount * apr).toFixed(2))
        : Number((incomingAmount / apr).toFixed(2));

    setOutgoingAmount(Number.isFinite(computed) ? computed : 0);
  }, [incomingAmount, apr, operationType]);

  useEffect(() => {
    if (!useCustomMarketRate) {
      setAutoMarketRate(marketApr);
    }
  }, [marketApr, useCustomMarketRate]);

  // When the preset type changes via query params (e.g. shortcuts)
  // We only need to react when the preset query parameter changes; setters are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (presetType === 'venta') {
      setOperationType('sell');
      setIncomingAssetCode(ASSET_DEFAULTS.sell.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.sell.outgoing);
    } else if (presetType === 'compra') {
      setOperationType('buy');
      setIncomingAssetCode(ASSET_DEFAULTS.buy.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.buy.outgoing);
    }
  }, [presetType]);

  const activeClient = useMemo(
    () => findClientLabel(clients, clientId) ?? draft?.client ?? null,
    [clients, clientId, draft],
  );

  const marginInfo = useMemo(
    () => formatMargin(activeClient?.lastMarginPercentage ?? null),
    [activeClient],
  );

  const marginPercent = useMemo(() => {
    if (!marketApr || marketApr === 0) {
      return 0;
    }
    if (!incomingAmount || !outgoingAmount) {
      return 0;
    }
    const operationRate =
      operationType === 'buy'
        ? outgoingAmount / incomingAmount
        : incomingAmount / outgoingAmount;
    return ((marketApr - operationRate) / marketApr) * 100;
  }, [incomingAmount, marketApr, operationType, outgoingAmount]);

  const secondaryAssetLabel = useMemo(
    () => findAssetLabel(outgoingAssetCode),
    [outgoingAssetCode]
  );
  const showSecondaryRates = outgoingAssetCode !== 'USD';

  useEffect(() => {
    if (!showSecondaryRates) {
      setSecondaryRate(1);
      setSecondaryMarketRate(1);
    }
  }, [showSecondaryRates]);

  const handleOperationTypeChange = useCallback(
    (type: TransactionType) => {
      setOperationType(type);
      setIncomingAssetCode(ASSET_DEFAULTS[type].incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS[type].outgoing);
      setIncomingAmount(outgoingAmount);
      setOutgoingAmount(incomingAmount);
    },
    [incomingAmount, outgoingAmount],
  );

  const handleToggleMarketRateMode = useCallback(
    (enabled: boolean) => {
      setUseCustomMarketRate(enabled);
      if (!enabled) {
        setMarketApr(autoMarketRate);
        refreshMarketRate().catch(() => {});
      }
    },
    [autoMarketRate, refreshMarketRate],
  );

  const handleNewClientCreated = useCallback(
    (client: ClientSummary) => {
      setClients((prev) => [client, ...prev.filter((item) => item.id !== client.id)]);
      setClientId(client.id);
      setIsNewClientModalOpen(false);
    },
    [setClients],
  );

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

  const validateForm = useCallback(() => {
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
      if (!validateForm()) {
        return;
      }

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

        setSuccessMessage('Borrador guardado correctamente.');
        setFormError(null);

        if (navigateToNext && savedDraft?.id) {
          await advanceStep(2);
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
      advanceStep,
      buildPayload,
      canEditMarketRate,
      marketApr,
      navigate,
      saveDraft,
      useCustomMarketRate,
      validateForm,
    ],
  );

  const handleSaveDraft = useCallback(() => executeSave(false), [executeSave]);
  const handleContinue = useCallback(() => executeSave(true), [executeSave]);
  const handleCancel = useCallback(() => navigate('/dashboard'), [navigate]);

  const busy = draftLoading || saving;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="pt-[165px] px-6 pb-8 max-w-6xl mx-auto">
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
          className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-8"
        >
          {busy && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex flex-col items-center justify-center rounded-lg">
              <LoadingSpinner size="lg" />
              <span className="text-sm text-gray-600 mt-3">Guardando cambios…</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            <div>
              <ClientSelection
                value={clientId}
                onChange={setClientId}
                clients={clients}
                onNewClient={() => setIsNewClientModalOpen(true)}
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
                enterLabel={`Entra (${incomingAssetCode})`}
                exitLabel={`Sale (${outgoingAssetCode})`}
                disabled={busy}
              />
              <MarginIndicator
                marginPercent={marginPercent}
                marketRate={marketApr}
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
        onClose={() => setIsNewClientModalOpen(false)}
        onCreated={handleNewClientCreated}
        defaultType="client"
        ownerOptions={['Operaciones', 'Tesorería', 'Comercial', 'Backoffice']}
        defaultOwner="Operaciones"
      />
    </div>
  );
};
