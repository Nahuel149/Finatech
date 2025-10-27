import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import type { TreasuryBalance } from '../../../types';
import { subscribeDashboardBalanceRefresh } from '../../../utils';

const TARGET_BALANCE_KEYS = [
  { key: 'cashUsd', label: 'Caja USD', currency: 'USD' },
  { key: 'cashArs', label: 'Efectivo ARS', currency: 'ARS' },
  { key: 'transfersArs', label: 'Transferencias ARS', currency: 'ARS' },
];

const mapBalanceToKey = (balance: TreasuryBalance) => {
  const label = balance.label.toLowerCase();
  if (label.includes('transfer') && balance.currency === 'ARS') return 'transfersArs';
  if (label.includes('efectivo') && balance.currency === 'ARS') return 'cashArs';
  if (label.includes('caja') && balance.currency === 'USD') return 'cashUsd';

  // Fallbacks by currency keywords
  if (balance.currency === 'USD' && label.includes('usd')) return 'cashUsd';
  if (balance.currency === 'ARS' && label.includes('ars') && label.includes('caja')) return 'cashArs';
  if (balance.currency === 'ARS' && label.includes('transfer')) return 'transfersArs';
  return null;
};

const formatAmount = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getLatestTimestamp = (balances: TreasuryBalance[]) => {
  if (!balances.length) return null;
  return balances.reduce((latest, balance) => {
    const ts = new Date(balance.updatedAt ?? Date.now()).getTime();
    return ts > latest ? ts : latest;
  }, 0);
};

interface DashboardBalanceWidgetProps {
  canView: boolean;
  pollInterval?: number;
}

export const DashboardBalanceWidget: React.FC<DashboardBalanceWidgetProps> = ({
  canView,
  pollInterval = 60000,
}) => {
  const navigate = useNavigate();
  const {
    balances,
    loading,
    error,
    refresh,
  } = useDashboardBalances({ enabled: canView, pollInterval: canView ? pollInterval : 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (!canView) {
      return undefined;
    }
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      refresh().catch(() => {});
    });
    return unsubscribe;
  }, [canView, refresh]);

  const trackedBalances = useMemo(() => {
    const mapped = new Map<string, TreasuryBalance>();
    balances.forEach((balance) => {
      const key = mapBalanceToKey(balance);
      if (key && !mapped.has(key)) {
        mapped.set(key, balance);
      }
    });
    return mapped;
  }, [balances]);

  const latestTimestamp = useMemo(() => {
    const timestamp = getLatestTimestamp(balances);
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [balances]);

  if (!canView) {
    return null;
  }

  const handleNavigate = () => {
    setTooltipVisible(false);
    navigate('/dashboard/tesoreria/saldos');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleNavigate}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <i className="fa-solid fa-wallet text-primary text-lg" aria-hidden="true" />
        <div className="flex items-center space-x-4">
          {loading && (
            <>
              {TARGET_BALANCE_KEYS.map(({ key }) => (
                <div key={key} className="flex flex-col space-y-1">
                  <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
                </div>
              ))}
            </>
          )}

          {!loading && !error && TARGET_BALANCE_KEYS.map(({ key, label, currency }) => {
            const balance = trackedBalances.get(key);
            return (
              <div key={key} className="flex flex-col text-left">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {label}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {balance ? formatAmount(balance.amount, balance.currency) : '—'}
                </span>
              </div>
            );
          })}

          {!loading && error && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500">Saldos</span>
              <span className="text-sm font-semibold text-danger">Error</span>
            </div>
          )}
        </div>
        <i className="fa-solid fa-chevron-right text-gray-300 text-xs" aria-hidden="true" />
        <span className="sr-only">Ver saldos detallados</span>
      </button>

      {(tooltipVisible && latestTimestamp) && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-lg">
          <div className="flex items-center text-gray-500">
            <i className="fa-solid fa-clock mr-2 text-primary" aria-hidden="true" />
            <span>Actualizado: {latestTimestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};
