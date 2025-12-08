import React from 'react';

interface Props {
  marginPercent: number;
  marketRate: number;
  operationType: 'buy' | 'sell';
  loading?: boolean;
  isValid?: boolean;
}

const formatPercent = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return '0.0%';
  }
  const formatted = Math.abs(value).toFixed(1);
  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${prefix}${formatted}%`;
};

const formatRate = (value: number) => {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return Number(value).toFixed(2);
};

export const MarginIndicator: React.FC<Props> = ({
  marginPercent,
  marketRate,
  operationType,
  loading = false,
  isValid = true,
}) => {
  const isPositive = marginPercent >= 0;
  const containerClasses = isPositive
    ? 'bg-green-50 border border-green-200'
    : 'bg-red-50 border border-red-200';
  const textClasses = isPositive ? 'text-green-600' : 'text-red-600';
  
  const operationHint =
    operationType === 'buy'
      ? 'Compra: t_operacion = ARS pagados por unidad del bien2'
      : 'Venta: t_operacion = ARS recibidos por unidad del bien2';

  const tooltipText = `Formula: (t_mercado - t_operacion) / t_mercado. ${operationHint}`;

  return (
    <div id="margin-indicator" className="mb-6">
      {loading ? (
        <div className="border border-gray-200 bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-6 bg-gray-200 rounded w-1/3" />
        </div>
      ) : !isValid ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation" />
              <span className="font-medium">Completa los datos para calcular el margen</span>
            </div>
            <span className="text-sm text-yellow-700">(vs mercado: TC {formatRate(marketRate)})</span>
          </div>
          <p className="text-xs mt-1 text-yellow-700">
            Ingresa montos y tasas de operacion/mercado para ver el margen estimado.
          </p>
        </div>
      ) : (
        <div className={`${containerClasses} rounded-lg p-4 transition-colors`} title={tooltipText}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${textClasses}`}>
              <i className="fa-solid fa-chart-line mr-2" />
              <span className="font-medium">Margen estimado de la operacion</span>
              <i className="fa-solid fa-info-circle ml-2 text-gray-400 cursor-help" title={tooltipText} />
            </div>
            <span className={`text-xl font-bold ${textClasses}`}>{formatPercent(marginPercent)}</span>
          </div>
          <div className={`text-sm mt-1 ${textClasses}`}>
            (vs mercado: TC {formatRate(marketRate)})
          </div>
        </div>
      )}
    </div>
  );
};
