import React, { useMemo } from 'react';
import {
  useDashboardBalances,
  useLiveOperations,
} from '../../../../hooks';
import { CompoundComputed, CompoundLine } from './CompoundSettlementForm';
import { TransactionType } from '../../../../types';

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
}) => {
  const { balances, loading, error } = useDashboardBalances({ pollInterval: 60000 });
  const { items: liveItems, totals: liveTotals, status: liveStatus, error: liveError } =
    useLiveOperations();

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
    const arsDirection = operationType === 'buy' ? -1 : 1;

    // USD leg always impact USD caja directly
    if (incomingIsUsd) {
      impacts.usd += incomingAmount;
    }
    if (outgoingIsUsd) {
      impacts.usd -= outgoingAmount;
    }

    // ARS leg: distribute by settlement method (efectivo vs transferencia/deposito)
    const baseIsArs = baseCurrency === 'ARS' && Number.isFinite(baseAmount) && baseAmount > 0;
    if (baseIsArs) {
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
          const rawAmount =
            info && Number.isFinite(info.amount) ? info.amount : Number(line.value) || 0;
          if (!rawAmount) return;
          pushToBucket(line.method, arsDirection * rawAmount);
        });
      }
    }

    return impacts;
  }, [
    baseAmount,
    baseCurrency,
    compoundLines,
    computedLines,
    incomingAmount,
    incomingCurrency,
    operationType,
    outgoingAmount,
    outgoingCurrency,
    settlementMode,
    simpleMethod,
  ]);

  const liveDraftImpacts = useMemo(() => {
    if (!draftId) {
      return null;
    }
    const key = `draft-${draftId}`;
    const item = liveItems.find((entry) => entry.id === key);
    return item?.impacts || null;
  }, [draftId, liveItems]);

  const displayImpacts = useMemo(
    () => currentImpacts,
    [currentImpacts],
  );

  const liveTotalsAdjusted = useMemo(() => {
    if (!liveDraftImpacts) {
      return liveTotals;
    }
    return {
      cash: (liveTotals.cash || 0) - (liveDraftImpacts.cash || 0),
      transfers: (liveTotals.transfers || 0) - (liveDraftImpacts.transfers || 0),
      usd: (liveTotals.usd || 0) - (liveDraftImpacts.usd || 0),
    };
  }, [liveDraftImpacts, liveTotals]);

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
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                liveStatus === 'live'
                  ? 'bg-green-500 animate-pulse'
                  : liveStatus === 'polling'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            Tiempo real
          </span>
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
          {liveStatus !== 'live' && (
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                liveStatus === 'polling'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
              title="Mostrando datos en modo degradado (polling)"
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
