import React from 'react';

interface Props {
  marginPercent: number;
  marketRate: number;
  loading?: boolean;
}

const formatPercent = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return '0.0%';
  }
  const formatted = Math.abs(value).toFixed(1);
  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${prefix}${formatted}%`;
};

export const MarginIndicator: React.FC<Props> = ({ marginPercent, marketRate, loading = false }) => {
  const isPositive = marginPercent >= 0;
  const containerClasses = isPositive
    ? 'bg-success bg-opacity-10 border border-success'
    : 'bg-danger bg-opacity-10 border border-danger';
  const textClasses = isPositive ? 'text-success' : 'text-danger';

  return (
    <div id="margin-indicator" className="mb-6">
      {loading ? (
        <div className="border border-gray-200 bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      ) : (
        <div className={`${containerClasses} rounded-lg p-4 transition-colors`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${textClasses}`}>
              <i className="fa-solid fa-chart-line mr-2" />
              <span className="font-medium">Margen estimado de la operación</span>
            </div>
            <span className={`text-xl font-bold ${textClasses}`}>{formatPercent(marginPercent)}</span>
          </div>
          <div className={`text-sm mt-1 ${textClasses}`}>
            (vs mercado: TC ${marketRate.toFixed(2)})
          </div>
        </div>
      )}
    </div>
  );
};
