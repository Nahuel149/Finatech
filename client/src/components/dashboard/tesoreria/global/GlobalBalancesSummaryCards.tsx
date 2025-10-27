import React from 'react';
import { TreasuryGlobalBalanceSummaryCard } from '../../../../types';

interface Props {
  cards: TreasuryGlobalBalanceSummaryCard[];
  loading?: boolean;
  activeAccountKey?: string | null;
  onSelectCard?: (accountKey: string) => void;
}

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const iconForLabel = (label: string, currency: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes('transfer')) return 'fa-money-bill-transfer';
  if (normalized.includes('efectivo')) return 'fa-hand-holding-dollar';
  if (currency === 'USD') return 'fa-dollar-sign';
  if (normalized.includes('caja')) return 'fa-wallet';
  return 'fa-chart-line';
};

const variationClasses = (direction: string) => {
  switch (direction) {
    case 'up':
      return { icon: 'fa-arrow-up', text: 'text-success' };
    case 'down':
      return { icon: 'fa-arrow-down', text: 'text-danger' };
    default:
      return { icon: 'fa-minus', text: 'text-neutral-amount' };
  }
};

const statusDot = (status?: string) => {
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

export const GlobalBalancesSummaryCards: React.FC<Props> = ({
  cards,
  loading,
  activeAccountKey,
  onSelectCard,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={`summary-skeleton-${index}`}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </div>
              <div className="w-3 h-3 bg-gray-200 rounded-full" />
            </div>
            <div className="h-6 w-32 bg-gray-100 rounded mb-2" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="mb-8 bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
        No encontramos saldos registrados todavía.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const variationMeta = variationClasses(card.variation.direction);
        const variationValue = Number.isFinite(card.variation.percentage)
          ? card.variation.percentage
          : 0;
        const isActive = activeAccountKey === card.id;
        const interactive = Boolean(onSelectCard);
        return (
          <div
            key={card.id}
            className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 transition-shadow ${
              interactive
                ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary'
                : ''
            } ${isActive ? 'ring-2 ring-primary' : ''}`}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onSelectCard?.(card.id) : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectCard?.(card.id);
                    }
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3">
                  <i
                    className={`fa-solid ${iconForLabel(card.label, card.currency)} text-primary`}
                  />
                </div>
                <span className="font-semibold text-text-primary">{card.label}</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${statusDot(card.status)}`} />
            </div>
            <div className="text-2xl font-bold text-text-primary mb-3">
              {formatAmount(card.amount, card.currency)}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">Actualizado {formatTime(card.updatedAt)}</div>
              <div className={`flex items-center space-x-1 ${variationMeta.text}`}>
                <i className={`fa-solid ${variationMeta.icon}`} />
                <span>
                  {variationMeta.icon === 'fa-minus'
                    ? '0.0%'
                    : `${variationValue > 0 ? '+' : ''}${variationValue.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
