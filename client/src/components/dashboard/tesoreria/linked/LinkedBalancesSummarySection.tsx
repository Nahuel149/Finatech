import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry } from '../../../../types';

interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  onViewDetail: (balanceId: string) => void;
  onSelectBalance: (balanceId: string) => void;
}

const ICON_MAP: Record<
  string,
  { icon: string; background: string; iconColor: string; label: string }
> = {
  usd: {
    icon: 'fa-dollar-sign',
    background: 'bg-yellow-100',
    iconColor: 'text-warning',
    label: 'Caja USD',
  },
  cash: {
    icon: 'fa-money-bills',
    background: 'bg-green-100',
    iconColor: 'text-success',
    label: 'Efectivo ARS',
  },
  transfers: {
    icon: 'fa-university',
    background: 'bg-blue-100',
    iconColor: 'text-primary',
    label: 'Transferencias ARS',
  },
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatUpdatedAt = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const variationIcon = (direction: string) => {
  switch (direction) {
    case 'up':
      return 'fa-arrow-up';
    case 'down':
      return 'fa-arrow-down';
    default:
      return 'fa-minus';
  }
};

const variationClass = (direction: string) => {
  switch (direction) {
    case 'up':
      return 'text-success';
    case 'down':
      return 'text-danger';
    default:
      return 'text-gray-500';
  }
};

const variationLabel = (percentage: number | null, direction: string) => {
  if (percentage === null || Number.isNaN(percentage)) {
    return '—';
  }
  const formatted = Math.abs(percentage).toLocaleString('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  if (percentage === 0) {
    return '0%';
  }
  return `${direction === 'down' ? '-' : '+'}${formatted}%`;
};

const SummarySkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[0, 1, 2].map((index) => (
      <div
        key={`summary-skeleton-${index}`}
        className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm animate-pulse"
      >
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg" />
            <div>
              <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-6 w-32 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-full bg-gray-100 rounded" />
      </div>
    ))}
  </div>
);

export const LinkedBalancesSummarySection: React.FC<Props> = ({
  balances,
  loading,
  onViewDetail,
  onSelectBalance,
}) => {
  if (loading) {
    return (
      <section id="balance-summary-section" className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Resumen de saldos</h2>
        <SummarySkeleton />
      </section>
    );
  }

  return (
    <section id="balance-summary-section" className="mb-10 lg:mb-12">
      <h2 className="text-lg font-semibold text-text-primary mb-6 lg:mb-8">Resumen de saldos</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
        {balances.map((balance) => {
          const iconConfig = ICON_MAP[balance.id] || ICON_MAP.cash;
          const variation = balance.variation || {
            percentage: null,
            direction: 'flat',
          };
          return (
            <div
              key={balance.id}
              className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 xl:p-8 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div
                    className={`w-12 h-12 ${iconConfig.background} rounded-lg flex items-center justify-center`}
                  >
                    <i className={`fa-solid ${iconConfig.icon} ${iconConfig.iconColor} text-lg`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">{iconConfig.label}</div>
                    <div className="text-2xl font-bold text-text-primary">
                      {formatCurrency(balance.amount, balance.currency)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center text-sm ${variationClass(variation.direction)}`}>
                    <i className={`fa-solid ${variationIcon(variation.direction)} mr-1`} />
                    {variationLabel(variation.percentage, variation.direction)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Actualizado {formatUpdatedAt(balance.updatedAt)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectBalance(balance.id);
                  onViewDetail(balance.id);
                }}
                className="w-full py-2 text-sm text-primary hover:bg-blue-50 rounded-lg transition-colors"
              >
                Ver detalle
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
