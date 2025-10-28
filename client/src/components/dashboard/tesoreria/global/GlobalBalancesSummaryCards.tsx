import React from 'react';
import { TreasuryGlobalBalanceSummaryCard } from '../../../../types';

interface Props {
  cards: TreasuryGlobalBalanceSummaryCard[];
  loading?: boolean;
  activeAccountKey?: string | null;
  onSelectCard?: (accountKey: string) => void;
  onRefresh?: () => void;
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
  if (normalized.includes('cuentas a cobrar')) return 'fa-file-invoice-dollar';
  if (currency === 'USD') return 'fa-dollar-sign';
  if (normalized.includes('caja')) return 'fa-dollar-sign';
  return 'fa-chart-line';
};

const variationClasses = (direction: string) => {
  switch (direction) {
    case 'up':
      return { icon: 'fa-arrow-up', textClass: 'text-success' };
    case 'down':
      return { icon: 'fa-arrow-down', textClass: 'text-danger' };
    default:
      return { icon: 'fa-minus', textClass: 'text-neutral-amount' };
  }
};

const amountClass = (amount: number) => {
  if (amount > 0) return 'positive-amount';
  if (amount < 0) return 'negative-amount';
  return 'neutral-amount';
};

export const GlobalBalancesSummaryCards: React.FC<Props> = ({
  cards,
  loading,
  activeAccountKey,
  onSelectCard,
  onRefresh,
}) => {
  if (loading) {
    return (
      <section id="account-summary" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Resumen por cuenta</h2>
          <button 
            className="flex items-center px-4 py-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
            disabled
          >
            <i className="fa-solid fa-refresh mr-2"></i>
            Actualizar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`summary-skeleton-${index}`}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-100 rounded mr-3" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded" />
                  <div className="h-3 w-12 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-32 bg-gray-100 rounded mb-2" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!cards.length) {
    return (
      <section id="account-summary" className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Resumen por cuenta</h2>
          <button 
            onClick={onRefresh}
            className="flex items-center px-4 py-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-refresh mr-2"></i>
            Actualizar
          </button>
        </div>
        
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          No encontramos saldos registrados todavía.
        </div>
      </section>
    );
  }

  return (
    <section id="account-summary" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Resumen por cuenta</h2>
        <button 
          onClick={onRefresh}
          className="flex items-center px-4 py-2 text-primary hover:bg-blue-50 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-refresh mr-2"></i>
          Actualizar
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              id={`account-card-${card.id}`}
              className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow ${
                interactive ? 'cursor-pointer' : ''
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
                  <i
                    className={`fa-solid ${iconForLabel(card.label, card.currency)} text-primary mr-3`}
                  />
                  <span className="font-semibold text-text-primary">{card.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className={`fa-solid ${variationMeta.icon} ${variationMeta.textClass} text-sm`} />
                  <span className={`text-sm ${variationMeta.textClass} font-medium`}>
                    {variationMeta.icon === 'fa-minus'
                      ? '0.0%'
                      : `${variationValue > 0 ? '+' : ''}${variationValue.toFixed(1)}%`}
                  </span>
                </div>
              </div>
              <div className={`text-2xl font-bold ${amountClass(card.amount)} mb-2`}>
                {formatAmount(card.amount, card.currency)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Actualizado {formatTime(card.updatedAt)}</span>
                <button 
                  onClick={(event) => {
                    event.stopPropagation();
                    // Handle "Ver desglose" action - could scroll to table or show details
                    if (onSelectCard) {
                      onSelectCard(card.id);
                    }
                  }}
                  className="text-primary hover:text-blue-700 text-sm font-medium"
                >
                  Ver desglose
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
