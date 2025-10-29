import React from 'react';
import { LogisticsMetrics } from '../../../types';

interface GeneralSummarySectionProps {
  metrics: LogisticsMetrics | null;
  loading: boolean;
}

const CARD_CONFIG = [
  {
    id: 'active-operations',
    title: 'Operaciones activas',
    description: 'En curso actualmente',
    icon: 'fa-clipboard-list',
    iconBackground: 'bg-blue-100',
    metricKey: 'active' as const,
  },
  {
    id: 'pending-deliveries',
    title: 'Entregas pendientes',
    description: 'A la espera de confirmación',
    icon: 'fa-truck',
    iconBackground: 'bg-orange-100',
    metricKey: 'pendingDeliveries' as const,
  },
  {
    id: 'internal-transfers',
    title: 'Transferencias internas',
    description: 'Movimientos físicos registrados',
    icon: 'fa-sync',
    iconBackground: 'bg-green-100',
    metricKey: 'internalTransfers' as const,
  },
  {
    id: 'completed-today',
    title: 'Completadas hoy',
    description: 'Últimas 24h',
    icon: 'fa-check-circle',
    iconBackground: 'bg-green-100',
    metricKey: 'completedToday' as const,
  },
];

const resolveTrend = (metrics: LogisticsMetrics | null, key: keyof LogisticsMetrics['trends']) => {
  if (!metrics) {
    return { value: '—', icon: 'fa-minus', tone: 'text-gray-400' };
  }

  const delta = metrics.trends[key];
  if (typeof delta !== 'number') {
    return { value: '—', icon: 'fa-minus', tone: 'text-gray-400' };
  }

  const tone = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-gray-500';
  const icon = delta > 0 ? 'fa-arrow-up' : delta < 0 ? 'fa-arrow-down' : 'fa-minus';
  const formatted = `${delta > 0 ? '+' : ''}${delta}%`;
  return { value: formatted, icon, tone };
};

export const GeneralSummarySection: React.FC<GeneralSummarySectionProps> = ({ metrics, loading }) => (
  <section id="general-summary-section" className="mb-10">
    <h2 className="text-lg font-semibold text-text-primary mb-4">Resumen general</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARD_CONFIG.map((card) => {
        const value = metrics ? metrics[card.metricKey] : null;
        const displayValue = loading && !metrics ? '—' : value ?? 0;
        const trend = resolveTrend(metrics, card.metricKey);

        return (
          <div key={card.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`${card.iconBackground} w-12 h-12 rounded-lg flex items-center justify-center mr-4`}>
                  <i className={`fa-solid ${card.icon} text-primary text-lg`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">{card.title}</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {typeof displayValue === 'number' ? displayValue : displayValue}
                  </div>
                </div>
              </div>
              <div className={`flex items-center text-sm ${trend.tone}`}>
                <i className={`fa-solid ${trend.icon} mr-1`} />
                {trend.value}
              </div>
            </div>
            <div className="text-xs text-gray-500">{card.description}</div>
          </div>
        );
      })}
    </div>
  </section>
);

export default GeneralSummarySection;
