import React from 'react';
import { useTreasuryBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';

interface Props {
  onSelectBalance?: (balanceId: string) => void;
}

const formatAmount = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatTime = (iso?: string) => {
  const date = iso ? new Date(iso) : new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const iconForBalance = (label?: string, currency?: string) => {
  if (label?.toLowerCase().includes('transfer')) return 'fa-money-bill-transfer';
  if (label?.toLowerCase().includes('efectivo')) return 'fa-hand-holding-dollar';
  if (currency === 'USD') return 'fa-dollar-sign';
  return 'fa-wallet';
};

const statusDotClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'ok':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'error':
      return 'bg-danger';
    default:
      return 'bg-gray-300';
  }
};

const shouldShowRetry = (status?: string) => (status || '').toLowerCase() === 'error';

const cardInteractiveProps = (
  balanceId: string,
  handler?: (balanceId: string) => void
) => {
  if (!handler) {
    return {};
  }
  const onActivate = () => handler(balanceId);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler(balanceId);
    }
  };
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown,
  };
};

export const TreasuryBalanceStripe: React.FC<Props> = ({ onSelectBalance }) => {
  const { balances, loading, error, refresh } = useTreasuryBalances();

  return (
    <div
      id="balance-stripe"
      className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40"
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading &&
            [0, 1, 2].map((index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                </div>
                <div className="h-6 w-40 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}

          {!loading &&
            !error &&
            balances.map((balance: TreasuryBalance) => {
              const interactiveProps = cardInteractiveProps(balance.id, onSelectBalance);
              const isInteractive = Boolean(onSelectBalance);
              return (
                <div
                  key={`${balance.id}-${balance.currency}`}
                  id={`balance-${balance.id}`}
                  className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${
                    isInteractive
                      ? 'cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary'
                      : ''
                  }`}
                  {...interactiveProps}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <i
                        className={`fa-solid ${iconForBalance(balance.label, balance.currency)} text-primary mr-2`}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        {balance.label}
                      </span>
                    </div>
                    <div className={`w-2 h-2 ${statusDotClass(balance.status)} rounded-full`} />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {formatAmount(balance.amount, balance.currency)}
                  </div>
                  {shouldShowRetry(balance.status) ? (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Error conexión</div>
                      <button
                        type="button"
                        onClick={() => refresh()}
                        className="text-xs text-primary hover:underline"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Actualizado {formatTime(balance.updatedAt)}
                    </div>
                  )}
                </div>
              );
            })}

          {!loading && error && (
            <>
              {[0, 1, 2].map((index) => (
                <div
                  key={`error-${index}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <i className="fa-solid fa-wallet text-primary mr-2" />
                      <span className="text-sm font-medium text-gray-600">Balance</span>
                    </div>
                    <div className="w-2 h-2 bg-danger rounded-full" />
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">—</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Error conexión</div>
                    <button
                      type="button"
                      onClick={() => refresh()}
                      className="text-xs text-primary hover:underline"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
