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
} from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { DashboardFooter } from '../Footer';
import { WizardHeader } from './WizardHeader';
import { ClientSelection } from './ClientSelection';
import { OperationTypeSelector } from './OperationTypeSelector';
import { AssetSelection, AssetOption } from './AssetSelection';
import { SubtypeSelector } from './SubtypeSelector';
import { ExchangeRatesSection } from './ExchangeRatesSection';
import { AmountSection } from './AmountSection';
import { MarginIndicator } from './MarginIndicator';
import { ValidationChecklist } from './ValidationChecklist';
import { WizardActions } from './WizardActions';
import { NewClientModal } from './NewClientModal';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';

const SUBTYPE_OPTIONS = [
  'USD Billete',
  'USD Transferencia',
  'Cheque diferido',
  'Transferencia bancaria',
];

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
  buy: { incoming: 'ARS', outgoing: 'USD' },
  sell: { incoming: 'USD', outgoing: 'ARS' },
};

const SECONDARY_ASSET_LABEL = 'BTC';
const SECONDARY_ASSET_DEFAULT_RATE = 0.0000215;
const SECONDARY_ASSET_DEFAULT_MARKET_RATE = 0.000021;

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
  const [subtype, setSubtype] = useState<string>(SUBTYPE_OPTIONS[0]);
  const [apr, setApr] = useState<number>(833.5);
  const [marketApr, setMarketApr] = useState<number>(830.0);
  const [incomingAmount, setIncomingAmount] = useState<number>(125000.0);
  const [outgoingAmount, setOutgoingAmount] = useState<number>(150.0);
  const [secondaryRate, setSecondaryRate] = useState<number>(
    SECONDARY_ASSET_DEFAULT_RATE,
  );
  const [secondaryMarketRate, setSecondaryMarketRate] = useState<number>(
    SECONDARY_ASSET_DEFAULT_MARKET_RATE,
  );
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
    setSubtype(draft.subtype || SUBTYPE_OPTIONS[0]);
    setApr(sanitizeNumber(draft.apr));
    setMarketApr(sanitizeNumber(draft.marketApr));
    setIncomingAmount(sanitizeNumber(draft.incomingAmount));
    setOutgoingAmount(sanitizeNumber(draft.outgoingAmount));

    const metadata = parseNotes(draft.notes);
    if (metadata) {
      setSecondaryRate(sanitizeNumber(metadata.rate) || SECONDARY_ASSET_DEFAULT_RATE);
      setSecondaryMarketRate(
        sanitizeNumber(metadata.marketRate) || SECONDARY_ASSET_DEFAULT_MARKET_RATE,
      );
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
    if (apr > 0) {
      const computed = Number((incomingAmount / apr).toFixed(2));
      setOutgoingAmount(Number.isFinite(computed) ? computed : 0);
    } else {
      setOutgoingAmount(0);
    }
  }, [incomingAmount, apr]);

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
    return ((apr - marketApr) / marketApr) * 100;
  }, [apr, marketApr]);

  const handleOperationTypeChange = useCallback(
    (type: TransactionType) => {
      setOperationType(type);
      setIncomingAssetCode(ASSET_DEFAULTS[type].incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS[type].outgoing);
    },
    [],
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
      subtype,
      apr: Number(apr),
      marketApr: Number(marketApr),
      incomingAmount: Number(incomingAmount),
      outgoingAmount: Number(outgoingAmount),
      notes: encodeNotes(
        Number(secondaryRate),
        Number(secondaryMarketRate),
        SECONDARY_ASSET_LABEL,
      ),
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
    subtype,
  ]);

  const validateForm = useCallback(() => {
    if (!clientId) {
      setFormError('Seleccioná un cliente antes de continuar.');
      return false;
    }
    if (!subtype.trim()) {
      setFormError('Indicá el subtipo de la operación.');
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
  }, [apr, clientId, incomingAmount, marketApr, subtype]);

  const executeSave = useCallback(
    async (navigateToNext: boolean) => {
      if (!validateForm()) {
        return;
      }

      try {
        const payload = buildPayload();
        const savedDraft = await saveDraft(payload);
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
    [advanceStep, buildPayload, navigate, saveDraft, validateForm],
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

              <SubtypeSelector
                value={subtype}
                options={SUBTYPE_OPTIONS}
                onChange={setSubtype}
              />
            </div>

            <div>
              <ExchangeRatesSection
                arsRate={apr}
                onArsRateChange={setApr}
                arsMarketRate={marketApr}
                assetRate={secondaryRate}
                onAssetRateChange={setSecondaryRate}
                assetMarketRate={secondaryMarketRate}
                assetLabel={SECONDARY_ASSET_LABEL}
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
      />
    </div>
  );
};
