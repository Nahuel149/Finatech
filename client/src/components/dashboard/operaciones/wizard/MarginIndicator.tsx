import React from 'react';

interface Props {
  marginPercent: number;
  marketRate: number;
  operationType: 'buy' | 'sell';
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

export const MarginIndicator: React.FC<Props> = ({ marginPercent, marketRate, operationType, loading = false }) => {
  const isPositive = marginPercent >= 0;
  // Colores según las reglas: verde si margen ≥ 0; rojo si < 0
  const containerClasses = isPositive
    ? 'bg-green-50 border border-green-200'
    : 'bg-red-50 border border-red-200';
  const textClasses = isPositive ? 'text-green-600' : 'text-red-600';
  
  const operationHint =
    operationType === 'buy'
      ? 'Compra: t_operación = ARS pagados por unidad del bien2'
      : 'Venta: t_operación = ARS recibidos por unidad del bien2';

  const tooltipText = `Fórmula: (t_mercado - t_operación) / t_mercado. ${operationHint}`;

  return (
    <div id="margin-indicator" className="mb-6">
      {loading ? (
        <div className="border border-gray-200 bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      ) : (
        <div className={`${containerClasses} rounded-lg p-4 transition-colors`} title={tooltipText}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${textClasses}`}>
              <i className="fa-solid fa-chart-line mr-2" />
              <span className="font-medium">Margen estimado de la operación</span>
              <i className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help" title={tooltipText} />
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
