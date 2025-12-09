import React, { useMemo } from 'react';
import { useDashboardBalances, useLatestMarketRate, useLiveOperations } from '../../../../hooks';

interface Props {
  incomingAmount: number;
  outgoingAmount: number;
  incomingCurrency: string;
  outgoingCurrency: string;
  apr?: number | null;
  currentMarginPercent?: number | null;
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

const toArs = (amount: number, currency: string, rate?: number | null) => {
  if (!Number.isFinite(amount)) return 0;
  if (currency === 'ARS') return amount;
  if (currency === 'USD' && Number.isFinite(rate)) return amount * (rate as number);
  return 0;
};

const formatRate = (value?: number | null) => {
  if (!Number.isFinite(Number(value))) {
    return '--';
  }
  return Number(value).toFixed(2);
};

export const ArsPositionAside: React.FC<Props> = ({
  incomingAmount,
  outgoingAmount,
  incomingCurrency,
  outgoingCurrency,
  apr = null,
  currentMarginPercent = null,
}) => {
  const { balances, loading, error } = useDashboardBalances({ pollInterval: 15000 });
  const { totals: liveTotals, weightedMarginPercent, status: liveStatus, error: liveError } = useLiveOperations();
  const { data: liveRate } = useLatestMarketRate({
    baseAsset: 'USD',
    quoteAsset: 'ARS',
    enabled: true,
  });

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

  const effectiveRate = useMemo(() => liveRate?.rate ?? apr ?? null, [apr, liveRate?.rate]);

  const deltaArs = useMemo(() => {
    const incomingArs = toArs(incomingAmount, incomingCurrency, effectiveRate);
    const outgoingArs = toArs(outgoingAmount, outgoingCurrency, effectiveRate);
    return incomingArs - outgoingArs;
  }, [effectiveRate, incomingAmount, incomingCurrency, outgoingAmount, outgoingCurrency]);

  const currentImpacts = useMemo(() => {
    const impacts = { cash: 0, transfers: 0, usd: 0 };
    const incomingIsUsd = incomingCurrency === 'USD';
    const outgoingIsUsd = outgoingCurrency === 'USD';

    if (incomingIsUsd) {
      impacts.usd += incomingAmount;
    } else {
      impacts.transfers += incomingAmount;
    }

    if (outgoingIsUsd) {
      impacts.usd -= outgoingAmount;
    } else {
      impacts.transfers -= outgoingAmount;
    }

    return impacts;
  }, [incomingAmount, incomingCurrency, outgoingAmount, outgoingCurrency]);

  const aggregated = useMemo(
    () => ({
      cash: currentCash + (liveTotals.cash || 0) + currentImpacts.cash,
      transfers: currentTransfers + (liveTotals.transfers || 0) + currentImpacts.transfers,
      usd: currentUsd + (liveTotals.usd || 0) + currentImpacts.usd,
    }),
    [
      currentCash,
      currentImpacts.cash,
      currentImpacts.transfers,
      currentImpacts.usd,
      currentTransfers,
      currentUsd,
      liveTotals.cash,
      liveTotals.transfers,
      liveTotals.usd,
    ],
  );

  const projectedArs = aggregated.cash + aggregated.transfers;
  const trend = deltaArs === 0 ? 'neutral' : deltaArs > 0 ? 'up' : 'down';

  const currentMarginWeightArs = useMemo(() => {
    if (outgoingCurrency === 'ARS') {
      return Math.abs(outgoingAmount);
    }
    if (incomingCurrency === 'ARS') {
      return Math.abs(incomingAmount);
    }
    return 0;
  }, [incomingAmount, incomingCurrency, outgoingAmount, outgoingCurrency]);

  const combinedWeightedMargin = useMemo(() => {
    const liveMargin = weightedMarginPercent;
    const currentMargin = Number.isFinite(currentMarginPercent || 0) ? currentMarginPercent : null;
    const currentWeight = currentMargin && currentMarginWeightArs ? currentMarginWeightArs : 0;

    if (currentMargin == null || currentWeight === 0) {
      return liveMargin;
    }

    if (liveMargin == null) {
      return currentMargin;
    }

    // Approximate combination: assume liveMargin applies to liveTotals.transfers (ARS scope)
    const liveWeightApprox = Math.abs(liveTotals.transfers || 0);
    const totalWeight = liveWeightApprox + currentWeight;
    if (totalWeight === 0) {
      return null;
    }
    const combined =
      ((liveMargin || 0) * liveWeightApprox + currentMargin * currentWeight) / totalWeight;
    return Number(combined.toFixed(2));
  }, [currentMarginPercent, currentMarginWeightArs, liveTotals.transfers, weightedMarginPercent]);

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                liveStatus === 'live' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}
            />
            Tiempo real
          </span>
          {effectiveRate && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
              USD/ARS: {formatRate(effectiveRate)}
            </span>
          )}
          {combinedWeightedMargin != null && (
            <span className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700">
              Margen ponderado: {combinedWeightedMargin.toFixed(2)}%
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Efectivo (ARS)</p>
              <span className="text-xs text-gray-500">
                Live: {formatArs(currentCash + (liveTotals.cash || 0))}
              </span>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatArs(aggregated.cash)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Transferencias (ARS)</p>
              <span className="text-xs text-gray-500">
                Live: {formatArs(currentTransfers + (liveTotals.transfers || 0))}
              </span>
            </div>
            <p className="text-lg font-semibold text-text-primary">{formatArs(aggregated.transfers)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-gray-500">Caja (USD)</p>
              <span className="text-xs text-gray-500">
                Live: {formatUsd(currentUsd + (liveTotals.usd || 0))}
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
