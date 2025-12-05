import React from 'react';
import { StatusIndicator, StatusType } from './StatusIndicator';
import { BalanceCardSkeleton } from './LoadingSkeleton';
import { Button } from './Button';

export interface BalanceCardData {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: StatusType;
  updatedAt?: string;
  icon?: string;
}

interface BalanceCardProps {
  data: BalanceCardData;
  loading?: boolean;
  error?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
  compact?: boolean;
  highlightBySign?: boolean;
}

const formatAmount = (amount: number, currency: string): string => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatTime = (iso?: string): string => {
  const date = iso ? new Date(iso) : new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const getIconForBalance = (label?: string, currency?: string, customIcon?: string): string => {
  if (customIcon) return customIcon;
  if (label?.toLowerCase().includes('transfer')) return 'fa-money-bill-transfer';
  if (label?.toLowerCase().includes('efectivo')) return 'fa-hand-holding-dollar';
  if (currency === 'USD') return 'fa-dollar-sign';
  return 'fa-wallet';
};

export const BalanceCard: React.FC<BalanceCardProps> = ({
  data,
  loading = false,
  error = false,
  onClick,
  onRetry,
  className = '',
  showRetryButton = true,
  compact = false,
  highlightBySign = false,
}) => {
  if (loading) {
    return <BalanceCardSkeleton className={className} />;
  }

  const icon = getIconForBalance(data.label, data.currency, data.icon);
  const isClickable = Boolean(onClick);
  const isError = error || data.status === 'error';
  const isPositive = data.amount > 0;
  const isNegative = data.amount < 0;

  const amountTone = highlightBySign && !isError
    ? isPositive
      ? 'text-green-600'
      : isNegative
      ? 'text-red-600'
      : 'text-gray-700'
    : 'text-text-primary';

  const cardClasses = `
    bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'} shadow-sm
    ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary' : ''}
    ${className}
  `.trim();

  const handleClick = () => {
    if (onClick && !isError) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick && !isError) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `Ver detalles de ${data.label}` : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <i className={`fa-solid ${icon} text-primary mr-2`} />
          <span className="text-sm font-medium text-gray-600">{data.label}</span>
        </div>
        <StatusIndicator status={data.status} />
      </div>
      
      <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold ${amountTone} mb-1`}>
        {isError ? '—' : formatAmount(data.amount, data.currency)}
      </div>
      
      {isError ? (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">Error conexión</div>
          {showRetryButton && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="text-xs text-primary hover:underline p-0 h-auto"
            >
              Reintentar
            </Button>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Actualizado {formatTime(data.updatedAt)}
        </div>
      )}
    </div>
  );
};
