import React, { useMemo } from 'react';
import { useDashboardBalances, useLatestMarketRate } from '../../../../hooks';

interface Props {
  incomingAmount: number;
  outgoingAmount: number;
  incomingCurrency: string;
  outgoingCurrency: string;
  apr?: number | null;
}

const formatArs = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
      })
    : '$ 0';

const toArs = (amount: number, currency: string, rate?: number | null) => {
  if (!Number.isFinite(amount)) return 0;
  if (currency === 'ARS') return amount;
  if (currency === 'USD' && Number.isFinite(rate)) return amount * (rate as number);
  return 0;
};

const formatRate = (value?: number | null) => {
  if (!Number.isFinite(Number(value))) {
    return '—';
  }
  return Number(value).toFixed(2);
};

export const ArsPositionAside: React.FC<Props> = ({
  incomingAmount,
  outgoingAmount,
  incomingCurrency,
  outgoingCurrency,
  apr = null,
}) => {
  const { balances, loading, error } = useDashboardBalances({ pollInterval: 15000 });
  const { data: liveRate } = useLatestMarketRate({
    baseAsset: 'USD',
    quoteAsset: 'ARS',
    enabled: true,
  });

  const currentArs = useMemo(
    () =>
      balances
        .filter((balance) => balance.currency === 'ARS')
        .reduce((acc, balance) => acc + (Number(balance.amount) || 0), 0),
    [balances],
  );

  const effectiveRate = useMemo(() => liveRate?.rate ?? apr ?? null, [apr, liveRate?.rate]);

  const deltaArs = useMemo(() => {
    const incomingArs = toArs(incomingAmount, incomingCurrency, effectiveRate);
    const outgoingArs = toArs(outgoingAmount, outgoingCurrency, effectiveRate);
    return incomingArs - outgoingArs;
  }, [effectiveRate, incomingAmount, incomingCurrency, outgoingAmount, outgoingCurrency]);

  const projectedArs = currentArs + deltaArs;
  const trend =
    deltaArs === 0 ? 'neutral' : deltaArs > 0 ? 'up' : 'down';

  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="sticky top-28 space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Tiempo real
          </span>
          {effectiveRate && (
            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
              USD/ARS: {formatRate(effectiveRate)}
            </span>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Posicion en ARS</p>
              <p className="text-lg font-semibold text-text-primary">{formatArs(currentArs)}</p>
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
              <span>Impacto de esta operacion</span>
              <span className={deltaArs === 0 ? 'text-gray-600' : deltaArs > 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                {deltaArs === 0 ? '—' : `${deltaArs > 0 ? '+' : ''}${formatArs(deltaArs)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Posicion proyectada</span>
              <span className="text-text-primary font-semibold">{formatArs(projectedArs)}</span>
            </div>
          </div>

          {loading && (
            <div className="text-xs text-gray-500">Actualizando saldos en tiempo real…</div>
          )}
          {error && (
            <div className="text-xs text-danger flex items-center gap-1">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error.message || 'No pudimos cargar la posicion.'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
