import React, { useMemo, useState, useEffect } from 'react';
import { useDashboardBalances } from '../../../../hooks/dashboard/useDashboardBalances';
import { useLiveOperations } from '../../../../hooks/useLiveOperations';
import { CompoundComputed, CompoundLine } from './CompoundSettlementForm';
import { TransactionType } from '../../../../types/transaction';

interface Props {
  incomingAmount: number;
  outgoingAmount: number;
  incomingCurrency: string;
  outgoingCurrency: string;
  draftId?: string | null;
  apr?: number | null;
  marketApr?: number | null;
  currentMarginPercent?: number | null;
  settlementMode: 'simple' | 'compound';
  simpleMethod: string;
  compoundLines: CompoundLine[];
  computedLines: Record<string, CompoundComputed>;
  baseAmount: number;
  baseCurrency: string;
  operationType: TransactionType;
  includeLiveTotals?: boolean;
}

const formatArs = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
      })
    : '$0';

const formatUsd = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      })
    : '$0.00';

const formatRateCurrency = (value?: number | null) => {
  if (!Number.isFinite(Number(value))) return '--';
  return `$${Number(value).toFixed(2)}`;
};

export const ArsPositionAside: React.FC<Props> = ({
  incomingAmount,
  outgoingAmount,
  incomingCurrency,
  outgoingCurrency,
  draftId = null,
  apr = null,
  marketApr = null,
  currentMarginPercent = null,
  settlementMode,
  simpleMethod,
  compoundLines,
  computedLines,
  baseAmount,
  baseCurrency,
  operationType,
  includeLiveTotals = true,
}) => {
  const { balances, loading, error } = useDashboardBalances({ pollInterval: 60000 });
  const { items: liveItems, totals: liveTotals, status: liveStatus, error: liveError } =
    useLiveOperations();
  const isLive = liveStatus === 'live' || liveStatus === 'idle';
  const [showLiveTotals, setShowLiveTotals] = useState(includeLiveTotals);

  useEffect(() => {
    setShowLiveTotals(includeLiveTotals);
  }, [includeLiveTotals]);

  const currentCash = useMemo(
    () => balances.find((balance) => balance.id === 'cash')?.amount || 0,
    [balances],
  );
  const currentTransfers = useMemo(
    () => balances.find((balance) => balance.id === 'transfers')?.amount || 0,
    [balances],
  );
  const currentUsd = useMemo(
    () => balances.find((balance) => balance.id === 'usd')?.amount || 0,
    [balances],
  );

  const marketRate = useMemo(
    () => (Number.isFinite(Number(marketApr)) ? Number(marketApr) : null),
    [marketApr],
  );
  const operationRate = useMemo(
    () => (Number.isFinite(Number(apr)) ? Number(apr) : null),
    [apr],
  );
  const currentImpacts = useMemo(() => {
    const impacts = { cash: 0, transfers: 0, usd: 0 };
    const incomingIsUsd = incomingCurrency === 'USD';
    const outgoingIsUsd = outgoingCurrency === 'USD';

    // USD leg always impact USD caja directly
    if (incomingIsUsd) {
      impacts.usd += incomingAmount;
    }
    if (outgoingIsUsd) {
      impacts.usd -= outgoingAmount;
    }

    // ARS leg: distribute by settlement method (efectivo vs transferencia/deposito)
    const arsAmount =
      incomingCurrency === 'ARS'
        ? incomingAmount
        : outgoingCurrency === 'ARS'
        ? outgoingAmount
        : 0;
    const arsDirection =
      incomingCurrency === 'ARS' ? 1 : outgoingCurrency === 'ARS' ? -1 : 0;

    if (Number.isFinite(arsAmount) && arsAmount > 0 && arsDirection !== 0) {
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
        pushToBucket(simpleMethod, arsDirection * arsAmount);
      } else {
        compoundLines.forEach((line) => {
          const info = computedLines[line.id];
          const rawAmount =
            info && Number.isFinite(info.amount) ? info.amount : Number(line.value) || 0;
          if (!rawAmount) return;
          pushToBucket(line.method, arsDirection * rawAmount);
        });
      }
    }

    return impacts;
  }, [
    compoundLines,
    computedLines,
    incomingAmount,
    incomingCurrency,
    outgoingAmount,
    outgoingCurrency,
    settlementMode,
    simpleMethod,
  ]);

  const liveSelfImpacts = useMemo(() => {
    if (!draftId) {
      return null;
    }
    const key = `draft-${draftId}`;
    const item = liveItems.find((entry) => entry.id === key || entry.id === draftId);
    return item?.impacts || null;
  }, [draftId, liveItems]);

  const displayImpacts = useMemo(
    () => currentImpacts,
    [currentImpacts],
  );

  const liveTotalsAdjusted = useMemo(() => {
    if (!showLiveTotals) {
      return { cash: 0, transfers: 0, usd: 0 };
    }
    if (!liveSelfImpacts) {
      return liveTotals;
    }
    return {
      cash: (liveTotals.cash || 0) - (liveSelfImpacts.cash || 0),
      transfers: (liveTotals.transfers || 0) - (liveSelfImpacts.transfers || 0),
      usd: (liveTotals.usd || 0) - (liveSelfImpacts.usd || 0),
    };
  }, [showLiveTotals, liveSelfImpacts, liveTotals]);

  const deltaArs = useMemo(
    () => displayImpacts.cash + displayImpacts.transfers,
    [displayImpacts.cash, displayImpacts.transfers],
  );

  const aggregated = useMemo(
    () => ({
      cash: currentCash + (liveTotalsAdjusted.cash || 0) + displayImpacts.cash,
      transfers: currentTransfers + (liveTotalsAdjusted.transfers || 0) + displayImpacts.transfers,
      usd: currentUsd + (liveTotalsAdjusted.usd || 0) + displayImpacts.usd,
    }),
    [
      currentCash,
      currentTransfers,
      currentUsd,
      displayImpacts.cash,
      displayImpacts.transfers,
      displayImpacts.usd,
      liveTotalsAdjusted.cash,
      liveTotalsAdjusted.transfers,
      liveTotalsAdjusted.usd,
    ],
  );

  const projectedArs = aggregated.cash + aggregated.transfers;
  const trend = deltaArs === 0 ? 'neutral' : deltaArs > 0 ? 'up' : 'down';
  const operationMargin =
    Number.isFinite(Number(currentMarginPercent)) ? Number(currentMarginPercent) : null;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isLive ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            Tiempo real
          </span>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary"
              checked={showLiveTotals}
              onChange={(event) => setShowLiveTotals(event.target.checked)}
            />
            Totales en vivo
          </label>
          {marketRate != null && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
              TC mercado: {formatRateCurrency(marketRate)}
            </span>
          )}
          {operationRate != null && (
            <span className="px-2 py-1 bg-green-50 rounded-full text-xs text-green-700">
              TC operacion: {formatRateCurrency(operationRate)}
            </span>
          )}
          {!isLive && (
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                'bg-red-50 text-red-700 border border-red-200'
              }`}
              title="Mostrando datos en modo degradado"
            >
              Modo degradado
            </span>
          )}
          {operationMargin != null && (
            <span className="px-2 py-1 bg-green-50 rounded-full text-xs text-green-700">
              Margen operacion: {operationMargin.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Efectivo (ARS)</p>
              <span className="text-xs text-gray-500">
                Live: {formatArs(currentCash + (liveTotalsAdjusted.cash || 0))}
              </span>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatArs(aggregated.cash)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Transferencias (ARS)</p>
              <span className="text-xs text-gray-500">
                Live: {formatArs(currentTransfers + (liveTotalsAdjusted.transfers || 0))}
              </span>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatArs(aggregated.transfers)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Caja (USD)</p>
              <span className="text-xs text-gray-500">
                Live: {formatUsd(currentUsd + (liveTotalsAdjusted.usd || 0))}
              </span>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatUsd(aggregated.usd)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Impacto actual (ARS)</p>
              <p className="text-lg font-semibold text-text-primary">{formatArs(deltaArs)}</p>
            </div>
            <div
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                trend === 'up'
                  ? 'bg-green-50 text-green-700'
                  : trend === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {trend === 'up' ? 'Sube' : trend === 'down' ? 'Baja' : 'Sin cambio'}
            </div>
          </header>

          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Posicion proyectada ARS</span>
              <span className="text-text-primary font-semibold">{formatArs(projectedArs)}</span>
            </div>
          </div>

          {(loading || liveStatus === 'polling') && (
            <div className="text-xs text-gray-500">Actualizando saldos en tiempo real…</div>
          )}
          {(error || liveError) && (
            <div className="text-xs text-danger flex items-center gap-1">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error?.message || liveError || 'No pudimos cargar la posicion.'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
