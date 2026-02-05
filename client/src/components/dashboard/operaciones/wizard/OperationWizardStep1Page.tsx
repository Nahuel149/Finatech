import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../../../../types/auth';
import { ClientSummary } from '../../../../types/client';
import { TransactionDraft, TransactionType, TransactionDraftPayload } from '../../../../types/transaction';
import { useClientsList } from '../../../../hooks/dashboard/useClientsList';
import { useLatestMarketRate } from '../../../../hooks/dashboard/useLatestMarketRate';
import { useTransactionDraft } from '../../../../hooks/dashboard/useTransactionDraft';
import { useClientDetail } from '../../../../hooks/useClientDetail';
import { useUserPermissions } from '../../../../hooks/useUserPermissions';
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
import { apiRequest, handleApiError } from '../../../../utils/api';
import { Modal } from '../../../ui/Modal';

const VALIDATION_ITEMS = [
  'TC dentro de limites establecidos',
  'Monto dentro de limites diarios',
  'Cliente con documentacion vigente',
];

const WIZARD_STEPS = [
  { label: 'Datos', description: 'Informacion' },
  { label: 'Liquidacion', description: 'Pago' },
  { label: 'Resumen', description: 'Confirmar' },
];

const OWNER_OPTIONS = ['Operaciones', 'Tesoreria', 'Comercial', 'Backoffice'];

const ASSET_CATALOG: AssetOption[] = [
  { code: 'ARS', label: 'ARS - Pesos Argentinos' },
  { code: 'USD', label: 'USD - Dolares' },
  { code: 'EUR', label: 'EUR - Euros' },
  { code: 'BRL', label: 'BRL - Reales' },
  { code: 'XAU', label: 'XAU - Oro' },
  { code: 'XME', label: 'XME - Metales' },
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

const clampToTwoDecimals = (value: number) =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : Number.NaN;

const formatRateInput = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }
  const fixed = clampToTwoDecimals(value).toFixed(2); // enforce max 2 decimals and display consistently
  return fixed.replace('.', ',');
};

const parseRateInput = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const formatAmountInput = (value: number) => {
  if (!Number.isFinite(value)) {
    return '';
  }
  const clamped = clampToTwoDecimals(value);
  return Number.isFinite(clamped) ? String(clamped) : '';
};

const parseAmountInput = (value: string) => parseRateInput(value);

const normalizeRateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const cleaned = trimmed.replace(/[^\d.,]/g, '');
  const firstSeparatorMatch = cleaned.match(/[,.]/);
  if (!firstSeparatorMatch) {
    return cleaned;
  }

  const firstSeparatorIndex = cleaned.indexOf(firstSeparatorMatch[0]);
  const integerPart = cleaned
    .slice(0, firstSeparatorIndex)
    .replace(/[.,]/g, '');
  const decimalsRaw = cleaned.slice(firstSeparatorIndex + 1).replace(/[.,]/g, '');
  const decimals = decimalsRaw.slice(0, 2);
  const hasTrailingSeparator = firstSeparatorIndex === cleaned.length - 1;

  if (hasTrailingSeparator) {
    return `${integerPart}${firstSeparatorMatch[0]}`;
  }

  if (decimals) {
    return `${integerPart}${firstSeparatorMatch[0]}${decimals}`;
  }

  return integerPart;
};

const normalizeAmountInput = (value: string) => normalizeRateInput(value);

const formatDraftTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDraftTypeLabel = (type: TransactionType) => (type === 'sell' ? 'Venta' : 'Compra');

const getDraftTypeParam = (type: TransactionType) => (type === 'sell' ? 'venta' : 'compra');

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
  const initialIncomingAmount = initialOperationType === 'buy' ? 150.0 : 125000.0;
  const initialOutgoingAmount = initialOperationType === 'buy' ? 125000.0 : 150.0;
  const [incomingAssetCode, setIncomingAssetCode] = useState<string>(
    ASSET_DEFAULTS[initialOperationType].incoming,
  );
  const [outgoingAssetCode, setOutgoingAssetCode] = useState<string>(
    ASSET_DEFAULTS[initialOperationType].outgoing,
  );
  const [apr, setApr] = useState<number>(833.5);
  const [marketApr, setMarketApr] = useState<number>(830.0);
  const [incomingAmount, setIncomingAmount] = useState<number>(initialIncomingAmount);
  const [incomingAmountInput, setIncomingAmountInput] = useState<string>(
    formatAmountInput(initialIncomingAmount),
  );
  const [outgoingAmount, setOutgoingAmount] = useState<number>(initialOutgoingAmount);
  const [secondaryRate, setSecondaryRate] = useState<number>(0);
  const [secondaryMarketRate, setSecondaryMarketRate] = useState<number>(0);
  const aprEditedRef = useRef(false);
  const secondaryRateEditedRef = useRef(false);
  const marketRateEditedRef = useRef(false);
  const [aprInput, setAprInput] = useState<string>(formatRateInput(apr));
  const [marketAprInput, setMarketAprInput] = useState<string>(formatRateInput(marketApr));
  const [secondaryRateInput, setSecondaryRateInput] = useState<string>('');
  const [secondaryMarketRateInput, setSecondaryMarketRateInput] = useState<string>('');
  const lastSecondaryRates = useRef<Map<string, { rate: number; marketRate: number }>>(new Map());
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [selectedClientSnapshot, setSelectedClientSnapshot] = useState<ClientSummary | null>(null);
  const [drafts, setDrafts] = useState<TransactionDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const handleArsRateInputChange = useCallback((value: string) => {
    aprEditedRef.current = true;
    const normalized = normalizeRateInput(value);
    setAprInput(normalized);
    setApr(parseRateInput(normalized));
  }, []);

  const handleArsMarketRateInputChange = useCallback((value: string) => {
    marketRateEditedRef.current = true;
    const normalized = normalizeRateInput(value);
    setMarketAprInput(normalized);
    setMarketApr(parseRateInput(normalized));
  }, []);
  const handleSecondaryRateInputChange = useCallback((value: string) => {
    secondaryRateEditedRef.current = true;
    const normalized = normalizeRateInput(value);
    setSecondaryRateInput(normalized);
    setSecondaryRate(parseRateInput(normalized));
  }, []);
  const handleSecondaryMarketRateInputChange = useCallback((value: string) => {
    const normalized = normalizeRateInput(value);
    setSecondaryMarketRateInput(normalized);
    setSecondaryMarketRate(parseRateInput(normalized));
  }, []);
  const handleIncomingAmountInputChange = useCallback((value: string) => {
    const normalized = normalizeAmountInput(value);
    setIncomingAmountInput(normalized);
    const parsed = parseAmountInput(normalized);
    setIncomingAmount(Number.isFinite(parsed) ? clampToTwoDecimals(parsed) : parsed);
  }, []);

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    setClients,
    search: searchClients,
  } = useClientsList(50);
  const {
    client: clientToEdit,
    loading: loadingClientToEdit,
    error: clientToEditError,
  } = useClientDetail(editClientId);

  const {
    draft,
    loading: draftLoading,
    saving,
    error: draftError,
    saveDraft,
  } = useTransactionDraft(draftId);

  const fetchDrafts = useCallback(async () => {
    setDraftsLoading(true);
    setDraftsError(null);
    try {
      const response = await apiRequest<{ items: TransactionDraft[] }>(
        '/api/transactions/drafts?limit=20',
        { method: 'GET' }
      );
      const items = Array.isArray(response.items) ? response.items : [];
      const filtered = draftId ? items.filter((item) => item.id !== draftId) : items;
      setDrafts(filtered);
    } catch (error) {
      const apiError = handleApiError(error);
      setDraftsError(apiError.message || 'No se pudieron cargar los borradores.');
    } finally {
      setDraftsLoading(false);
      setDraftsLoaded(true);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleOpenDrafts = useCallback(() => {
    setDraftsModalOpen(true);
    if (!draftsLoaded && !draftsLoading) {
      fetchDrafts();
    }
  }, [draftsLoaded, draftsLoading, fetchDrafts]);

  const handleSelectDraft = useCallback(
    (selectedDraft: TransactionDraft) => {
      setDraftsModalOpen(false);
      const typeParam = getDraftTypeParam(selectedDraft.type);
      navigate(`/dashboard/operaciones/nueva?draftId=${selectedDraft.id}&tipo=${typeParam}`);
    },
    [navigate],
  );

  const handleDeleteDraft = useCallback(
    async (selectedDraft: TransactionDraft) => {
      if (deletingDraftId) {
        return;
      }
      const clientLabel =
        selectedDraft.client?.shortName ||
        selectedDraft.client?.fullName ||
        'este borrador';
      const confirmDelete = window.confirm(`¿Eliminar ${clientLabel}?`);
      if (!confirmDelete) {
        return;
      }
      setDeletingDraftId(selectedDraft.id);
      setDraftsError(null);
      try {
        await apiRequest(`/api/transactions/${selectedDraft.id}/void`, {
          method: 'POST',
          body: { reason: 'Borrador eliminado desde el listado.' },
        });
        setDrafts((prev) => prev.filter((item) => item.id !== selectedDraft.id));
      } catch (error) {
        const apiError = handleApiError(error);
        setDraftsError(apiError.message || 'No se pudo eliminar el borrador.');
      } finally {
        setDeletingDraftId(null);
      }
    },
    [deletingDraftId],
  );


  
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
      ['admin', 'tesoreria', 'tesoreria-admin', 'manage-market-rates'].includes(permission)
    ),
  [normalizedPermissions]
);
  const [autoMarketRate, setAutoMarketRate] = useState<number>(marketApr);
  const {
    data: latestMarketRate,
    error: latestMarketRateError,
    loading: latestMarketRateLoading,
  } = useLatestMarketRate({
    baseAsset: 'USD',
    quoteAsset: 'ARS',
    enabled: true,
  });

  const resolveMarketRateForType = useCallback(
    (rate?: { rate?: number | null; buyRate?: number | null; sellRate?: number | null }) => {
      if (!rate) return null;
      const value =
        operationType === 'buy'
          ? rate.buyRate ?? rate.rate
          : rate.sellRate ?? rate.rate;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    },
    [operationType],
  );

  useEffect(() => {
    const resolvedRate = resolveMarketRateForType(latestMarketRate || undefined);
    if (!resolvedRate) {
      return;
    }

    if (!ratesAreEqual(autoMarketRate, resolvedRate)) {
      setAutoMarketRate(resolvedRate);
    }

    if (!marketRateEditedRef.current && !ratesAreEqual(marketApr, resolvedRate)) {
      setMarketApr(resolvedRate);
      setMarketAprInput(formatRateInput(resolvedRate));
    }

    // Keep operation rate aligned with market rate until the user edits it.
    if (!aprEditedRef.current && !ratesAreEqual(apr, resolvedRate)) {
      setApr(resolvedRate);
      setAprInput(formatRateInput(resolvedRate));
    }
  }, [apr, autoMarketRate, latestMarketRate, marketApr, resolveMarketRateForType]);
  const hasMarketRate = useMemo(() => {
    const resolvedRate = resolveMarketRateForType(latestMarketRate || undefined);
    return Number.isFinite(resolvedRate ?? Number.NaN);
  }, [latestMarketRate, resolveMarketRateForType]);

  const allowMarketRateEdit = useMemo(
    () =>
      canEditMarketRate ||
      Boolean(latestMarketRateError) ||
      (!latestMarketRateLoading && !hasMarketRate),
    [canEditMarketRate, hasMarketRate, latestMarketRateError, latestMarketRateLoading]
  );

  // Hydrate form with draft data when available
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAprInput(formatRateInput(draftApr));
      aprEditedRef.current = Number.isFinite(draftApr);
    }
    if (!ratesAreEqual(draftMarketApr, marketApr)) {
      setMarketApr(draftMarketApr);
      setMarketAprInput(formatRateInput(draftMarketApr));
    }
    if (!ratesAreEqual(draftMarketApr, autoMarketRate)) {
      setAutoMarketRate(draftMarketApr);
    }
    if (draftIncomingAmount !== incomingAmount) {
      setIncomingAmount(draftIncomingAmount);
      setIncomingAmountInput(formatAmountInput(draftIncomingAmount));
    }
      const metadata = parseNotes(draft.notes);
      if (metadata) {
        const draftSecondaryRate = sanitizeNumber(metadata.rate);
        const draftSecondaryMarketRate = sanitizeNumber(metadata.marketRate);
        
        if (Number.isFinite(draftSecondaryRate)) {
          setSecondaryRate(draftSecondaryRate);
          setSecondaryRateInput(formatRateInput(draftSecondaryRate));
        }
        if (Number.isFinite(draftSecondaryMarketRate)) {
          setSecondaryMarketRate(draftSecondaryMarketRate);
          setSecondaryMarketRateInput(formatRateInput(draftSecondaryMarketRate));
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

  const secondaryAssetCode = useMemo(() => {
    if (incomingAssetCode !== 'USD' && incomingAssetCode !== 'ARS') {
      return incomingAssetCode;
    }
    if (outgoingAssetCode !== 'USD' && outgoingAssetCode !== 'ARS') {
      return outgoingAssetCode;
    }
    return null;
  }, [incomingAssetCode, outgoingAssetCode]);

  const showSecondaryRates = Boolean(secondaryAssetCode);
  const secondaryIsIncoming = showSecondaryRates && secondaryAssetCode === incomingAssetCode;
  const secondaryIsOutgoing = showSecondaryRates && secondaryAssetCode === outgoingAssetCode;
  const { data: latestSecondaryMarketRate } = useLatestMarketRate({
    baseAsset: secondaryAssetCode || 'USD',
    quoteAsset: 'USD',
    enabled: showSecondaryRates && Boolean(secondaryAssetCode),
  });

  // Keep outgoing amount in sync with incoming amount and APR, considering secondary assets
  useEffect(() => {
    if (apr <= 0) {
      setOutgoingAmount(0);
      return;
    }

    let computed = 0;

    if (!showSecondaryRates) {
      // Legacy USD/ARS path
      computed =
        operationType === 'buy'
          ? Number((incomingAmount * apr).toFixed(4)) // USD * (ARS/USD) = ARS
          : Number((incomingAmount / apr).toFixed(4)); // ARS / (ARS/USD) = USD
    } else {
      // Secondary asset path using the secondary operation rate (secondary -> USD)
      const secRate = secondaryRate || secondaryMarketRate || 0;
      if (!secRate || secRate <= 0) {
        setOutgoingAmount(0);
        return;
      }

      if (secondaryIsOutgoing) {
        // Incoming ARS -> USD -> secondary (e.g., sell EUR for ARS or buy EUR with ARS)
        if (operationType === 'sell') {
          const usdAmount = incomingAmount / apr;
          computed = Number((usdAmount / secRate).toFixed(4)); // outgoing secondary units
        } else {
          // buying secondary with ARS: how many ARS to pay for incoming secondary units
          const usdNeeded = incomingAmount * secRate;
          computed = Number((usdNeeded * apr).toFixed(4)); // ARS to pay
        }
      } else if (secondaryIsIncoming) {
        // Incoming secondary -> USD -> ARS
        const usdValue =
          operationType === 'buy'
            ? incomingAmount * secRate
            : incomingAmount / secRate;

        computed = Number((usdValue * apr).toFixed(4)); // ARS pay/receive
      }
    }

    setOutgoingAmount(Number.isFinite(computed) ? clampToTwoDecimals(computed) : 0);
  }, [
    apr,
    incomingAmount,
    operationType,
    secondaryIsIncoming,
    secondaryIsOutgoing,
    secondaryMarketRate,
    secondaryRate,
    showSecondaryRates,
  ]);
  // When the preset type changes via query params (e.g. shortcuts)
  useEffect(() => {
    if (presetType === 'venta') {
      setOperationType('sell');
      setIncomingAssetCode(ASSET_DEFAULTS.sell.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.sell.outgoing);
      // Reset amounts for sell operation
      setIncomingAmount(clampToTwoDecimals(125000.0)); // ARS amount
      setIncomingAmountInput(formatAmountInput(125000.0));
      setOutgoingAmount(clampToTwoDecimals(150.0)); // USD amount
    } else if (presetType === 'compra') {
      setOperationType('buy');
      setIncomingAssetCode(ASSET_DEFAULTS.buy.incoming);
      setOutgoingAssetCode(ASSET_DEFAULTS.buy.outgoing);
      // Reset amounts for buy operation
      setIncomingAmount(clampToTwoDecimals(150.0)); // USD amount
      setIncomingAmountInput(formatAmountInput(150.0));
      setOutgoingAmount(clampToTwoDecimals(125000.0)); // ARS amount
    }
  }, [presetType, setOperationType, setIncomingAssetCode, setOutgoingAssetCode, setIncomingAmount, setOutgoingAmount]);

  useEffect(() => {
    if (operationType === 'buy') {
      if (incomingAssetCode === 'ARS') {
        setIncomingAssetCode(ASSET_DEFAULTS.buy.incoming);
      }
      if (outgoingAssetCode !== 'ARS') {
        setOutgoingAssetCode('ARS');
      }
      return;
    }

    if (operationType === 'sell') {
      if (incomingAssetCode !== 'ARS') {
        setIncomingAssetCode('ARS');
      }
      if (outgoingAssetCode === 'ARS') {
        setOutgoingAssetCode('USD');
      }
    }
  }, [operationType, incomingAssetCode, outgoingAssetCode]);

  const activeClient = useMemo(
    () => {
      if (!clientId) {
        return null;
      }
      return (
        findClientLabel(clients, clientId) ??
        (selectedClientSnapshot && selectedClientSnapshot.id === clientId ? selectedClientSnapshot : null) ??
        (draft?.client && (draft.client as ClientSummary).id === clientId ? (draft.client as ClientSummary) : null)
      );
    },
    [clients, clientId, draft, selectedClientSnapshot],
  );

  useEffect(() => {
    if (!clientId) {
      setSelectedClientSnapshot(null);
      return;
    }
    const match = findClientLabel(clients, clientId);
    if (match) {
      setSelectedClientSnapshot(match);
      return;
    }
    if (draft?.client && (draft.client as ClientSummary).id === clientId) {
      setSelectedClientSnapshot(draft.client as ClientSummary);
    }
  }, [clientId, clients, draft]);

  const marginInfo = useMemo(
    () => formatMargin(activeClient?.lastMarginPercentage ?? null),
    [activeClient],
  );

  const assetLabels = useMemo(
    () => ({ enter: 'Bien que entra', exit: 'Bien que sale' }),
    [],
  );

  const assetOptions = useMemo(() => {
    if (operationType === 'buy') {
      return {
        enter: ASSET_CATALOG.filter((option) => option.code !== 'ARS'),
        exit: ASSET_CATALOG.filter((option) => option.code === 'ARS'),
      };
    }

    // Venta: forzamos que entre ARS y salga cualquier no-ARS
    return {
      enter: ASSET_CATALOG.filter((option) => option.code === 'ARS'),
      exit: ASSET_CATALOG.filter((option) => option.code !== 'ARS'),
    };
  }, [operationType]);

  const amountLabels = useMemo(
    () => getAmountLabels(operationType, incomingAssetCode, outgoingAssetCode),
    [operationType, incomingAssetCode, outgoingAssetCode],
  );

  const isUsdPair = incomingAssetCode === 'USD' || outgoingAssetCode === 'USD';

  const effectiveMarketRate = useMemo(() => {
    if (showSecondaryRates && secondaryMarketRate && secondaryMarketRate !== 0) {
      // secondaryMarketRate is quoted as secondary -> USD, so ARS per secondary = (ARS per USD) * (USD per secondary)
      return marketApr * secondaryMarketRate;
    }
    return marketApr;
  }, [marketApr, secondaryMarketRate, showSecondaryRates]);

  const marginInputsValid = useMemo(
    () =>
      Number.isFinite(effectiveMarketRate) &&
      effectiveMarketRate > 0 &&
      Number.isFinite(incomingAmount) &&
      incomingAmount > 0 &&
      Number.isFinite(outgoingAmount) &&
      outgoingAmount > 0,
    [effectiveMarketRate, incomingAmount, outgoingAmount],
  );

  const marginPercent = useMemo(() => {
    if (!marginInputsValid) {
      return 0;
    }

    // Calcular t_operacion como ARS/bien2 segun las reglas
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

    const marginFormula = (
      operationType === 'sell'
        ? (operationRate - effectiveMarketRate) / effectiveMarketRate
        : (effectiveMarketRate - operationRate) / effectiveMarketRate
    );

    return marginFormula * 100;
  }, [incomingAmount, effectiveMarketRate, marginInputsValid, operationType, outgoingAmount]);

  const secondaryAssetLabel = useMemo(
    () => (secondaryAssetCode ? findAssetLabel(secondaryAssetCode) : ''),
    [secondaryAssetCode]
  );

  useEffect(() => {
    if (!showSecondaryRates || !secondaryAssetCode) {
      return;
    }

    secondaryRateEditedRef.current = false;

    const cached = lastSecondaryRates.current.get(secondaryAssetCode);
    if (cached) {
      setSecondaryMarketRate(cached.marketRate);
      setSecondaryMarketRateInput(formatRateInput(cached.marketRate));
      setSecondaryRate(cached.rate);
      setSecondaryRateInput(formatRateInput(cached.rate));
    } else {
      setSecondaryMarketRate(0);
      setSecondaryMarketRateInput('');
      setSecondaryRate(0);
      setSecondaryRateInput('');
    }
  }, [secondaryAssetCode, showSecondaryRates]);

  useEffect(() => {
    if (!showSecondaryRates || !secondaryAssetCode) {
      return;
    }

    const liveMarket = Number(latestSecondaryMarketRate?.rate);
    if (!Number.isFinite(liveMarket)) {
      return;
    }

    setSecondaryMarketRate(liveMarket);
    setSecondaryMarketRateInput(formatRateInput(liveMarket));

    if (!secondaryRateEditedRef.current) {
      setSecondaryRate(liveMarket);
      setSecondaryRateInput(formatRateInput(liveMarket));
    }

    lastSecondaryRates.current.set(secondaryAssetCode, {
      rate: secondaryRateEditedRef.current ? secondaryRate : liveMarket,
      marketRate: liveMarket,
    });
  }, [latestSecondaryMarketRate, secondaryAssetCode, showSecondaryRates, secondaryRate]);

  useEffect(() => {
    if (showSecondaryRates && secondaryAssetCode) {
      lastSecondaryRates.current.set(secondaryAssetCode, {
        rate: secondaryRate,
        marketRate: secondaryMarketRate,
      });
    }
  }, [secondaryRate, secondaryMarketRate, secondaryAssetCode, showSecondaryRates]);

  // Build payload function for auto-save
  const buildPayload = useCallback((): TransactionDraftPayload => {
    const secondaryCode = secondaryAssetCode || outgoingAssetCode;
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
    secondaryAssetCode,
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

  const handleIncomingAssetChange = useCallback(
    (code: string) => {
      if (operationType === 'buy' && code === 'ARS') {
        setIncomingAssetCode(ASSET_DEFAULTS.buy.incoming);
        return;
      }
      setIncomingAssetCode(code);
    },
    [operationType],
  );

  const handleOutgoingAssetChange = useCallback(
    (_code: string) => {
      if (operationType === 'buy') {
        setOutgoingAssetCode('ARS');
        return;
      }
      setOutgoingAssetCode(_code);
    },
    [operationType],
  );

  const handleNewClientCreated = useCallback(
    (client: ClientSummary) => {
      setClients((prev) => [client, ...prev.filter((item) => item.id !== client.id)]);
      setClientId(client.id);
      setEditClientId(null);
      setIsNewClientModalOpen(false);
    },
    [setClients],
  );
  
  const handleOpenNewClientModal = useCallback(() => {
    setEditClientId(null);
    setIsNewClientModalOpen(true);
  }, []);
  
  const handleCloseNewClientModal = useCallback(() => {
    setEditClientId(null);
    setIsNewClientModalOpen(false);
  }, []);

  const handleEditClient = useCallback(() => {
    if (!clientId) return;
    setEditClientId(clientId);
    setIsNewClientModalOpen(true);
  }, [clientId]);

  const handleClientUpdated = useCallback(
    (client: ClientSummary) => {
      setClients((prev) => [client, ...prev.filter((item) => item.id !== client.id)]);
      setClientId(client.id);
      setEditClientId(null);
      setIsNewClientModalOpen(false);
    },
    [setClients],
  );
  
  const validateForm = useCallback(() => {
    devLog('validateForm - clientId:', clientId, 'type:', typeof clientId);
    if (!clientId) {
      setFormError('Selecciona un cliente antes de continuar.');
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
    if (!Number.isFinite(outgoingAmount) || outgoingAmount <= 0) {
      setFormError('El monto de salida debe ser mayor a 0.');
      return false;
    }
    if (operationType === 'buy' && incomingAssetCode === 'ARS') {
      setFormError('En compras, el activo de entrada debe ser distinto de ARS.');
      return false;
    }
    if (operationType === 'buy' && outgoingAssetCode !== 'ARS') {
      setFormError('En compras, el activo de salida debe ser ARS.');
      return false;
    }
    setFormError(null);
    return true;
  }, [
    apr,
    clientId,
    incomingAmount,
    incomingAssetCode,
    marketApr,
    operationType,
    outgoingAmount,
    outgoingAssetCode,
  ]);

  const executeSave = useCallback(
    async (navigateToNext: boolean) => {
      try {
        const payload = buildPayload();
        const savedDraft = await saveDraft(payload);

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
      await fetchDrafts();
    } finally {
      setIsExecuting(false);
    }
  }, [executeSave, fetchDrafts, isExecuting, validateForm]);
  
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
  const draftsAvailable = draftsLoaded && drafts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main id="wizard-container" className="flex-grow pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-8 max-w-6xl mx-auto overflow-x-hidden lg:overflow-x-visible">
        <WizardHeader
          steps={WIZARD_STEPS}
          currentStep={0}
          onBack={() => navigate('/dashboard')}
          currencies={[incomingAssetCode, outgoingAssetCode]}
        />

        {(formError || draftError || clientsError) && (
          <Alert
            type="error"
            message={
              formError ||
              draftError?.message ||
              clientsError?.message ||
              'Ocurri? un error desconocido.'
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
          className="relative p-0 lg:p-8 bg-transparent lg:bg-white lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-sm"
        >
          {busy && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex flex-col items-center justify-center rounded-lg">
              <LoadingSpinner size="lg" />
              <span className="text-sm text-gray-600 mt-3">Guardando cambios</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 sm:p-5 lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent">
                <ClientSelection
                  value={clientId}
                  onChange={handleClientChange}
                  selectedClient={activeClient}
                  clients={clients}
                  onNewClient={handleOpenNewClientModal}
                  onEditClient={handleEditClient}
                  onSearch={searchClients}
                  marginInfo={marginInfo}
                  loading={clientsLoading}
                  error={clientsError?.message || null}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 sm:p-5 lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent">
                <OperationTypeSelector
                  value={operationType}
                  onChange={handleOperationTypeChange}
                  disabled={busy}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 sm:p-5 lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent">
                <AssetSelection
                  enterValue={incomingAssetCode}
                  exitValue={outgoingAssetCode}
                  enterOptions={assetOptions.enter}
                  exitOptions={assetOptions.exit}
                  onEnterChange={handleIncomingAssetChange}
                  onExitChange={handleOutgoingAssetChange}
                  enterLabel={assetLabels.enter}
                  exitLabel={assetLabels.exit}
                  disabled={busy}
                />
              </div>

            </div>

            <div>
              <ExchangeRatesSection
                arsRate={aprInput}
                onArsRateChange={handleArsRateInputChange}
                arsMarketRate={marketAprInput}
                onArsMarketRateChange={handleArsMarketRateInputChange}
                assetRate={secondaryRateInput}
                onAssetRateChange={handleSecondaryRateInputChange}
                assetMarketRate={secondaryMarketRateInput}
                onAssetMarketRateChange={handleSecondaryMarketRateInputChange}
                assetLabel={secondaryAssetLabel}
                showSecondaryRates={showSecondaryRates}
                disabled={busy}
                disableMarketRates={!allowMarketRateEdit}
                disablePrimaryRates={!isUsdPair && showSecondaryRates}
              />
              <AmountSection
                enterAmount={incomingAmountInput}
                onEnterAmountChange={handleIncomingAmountInputChange}
                exitAmount={outgoingAmount}
                enterLabel={amountLabels.enterLabel}
                exitLabel={amountLabels.exitLabel}
                disabled={busy}
              />
              <MarginIndicator
                marginPercent={marginPercent}
                marketRate={effectiveMarketRate}
                operationType={operationType}
                isValid={marginInputsValid}
                loading={busy}
              />
              <ValidationChecklist items={VALIDATION_ITEMS} loading={busy} />
            </div>
          </div>

          <WizardActions
            onSaveDraft={handleSaveDraft}
            onCancel={handleCancel}
            onContinue={handleContinue}
            onViewDrafts={handleOpenDrafts}
            saving={busy}
            disableContinue={busy}
            disableSave={busy}
            viewDraftsDisabled={!draftsAvailable || busy}
            viewDraftsLoading={draftsLoading}
          />

          <Modal
            isOpen={draftsModalOpen}
            onClose={() => setDraftsModalOpen(false)}
            title="Borradores guardados"
            size="lg"
          >
            {draftsLoading && (
              <div className="flex items-center text-sm text-gray-500">
                <i className="fa-solid fa-circle-notch mr-2 animate-spin" />
                Cargando borradores...
              </div>
            )}
            {!draftsLoading && draftsError && (
              <div className="text-sm text-danger">{draftsError}</div>
            )}
            {!draftsLoading && !draftsError && drafts.length === 0 && (
              <div className="text-sm text-gray-500">No hay borradores disponibles.</div>
            )}
            {!draftsLoading && !draftsError && drafts.length > 0 && (
              <div className="space-y-3">
                {drafts.map((draftItem) => {
                  const clientLabel =
                    draftItem.client?.shortName ||
                    draftItem.client?.fullName ||
                    'Cliente sin nombre';
                  const typeLabel = getDraftTypeLabel(draftItem.type);
                  const stepLabel = `Paso ${draftItem.currentStep || 1}`;
                  const statusLabel = draftItem.status === 'pending' ? 'Pendiente' : 'Borrador';
                  const isDeleting = deletingDraftId === draftItem.id;
                  return (
                    <div
                      key={draftItem.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors focus-within:border-primary"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectDraft(draftItem)}
                        className="flex-1 text-left px-4 py-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{clientLabel}</div>
                            <div className="text-xs text-gray-500">
                              {typeLabel} · {stepLabel} · {statusLabel}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDraftTimestamp(draftItem.updatedAt)}
                          </div>
                        </div>
                      </button>
                      <div className="pr-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(draftItem)}
                          disabled={isDeleting}
                          className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-danger hover:border-danger transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          title="Eliminar borrador"
                        >
                          {isDeleting ? (
                            <i className="fa-solid fa-circle-notch animate-spin" />
                          ) : (
                            <i className="fa-solid fa-trash" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Modal>
        </section>
      </main>

      <DashboardFooter />

      <NewClientModal
        open={isNewClientModalOpen}
        onClose={handleCloseNewClientModal}
        onCreated={handleNewClientCreated}
        onUpdated={handleClientUpdated}
        clientToEdit={clientToEdit}
        loadingClient={loadingClientToEdit}
        clientError={clientToEditError?.message || null}
        defaultType="client"
        ownerOptions={OWNER_OPTIONS}
        defaultOwner="Operaciones"
      />
    </div>
  );
};

