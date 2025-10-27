import React from 'react';
import { 
  TruckIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '../../icons/HeroiconsOutline';

interface SummaryStats {
  totalMovements: number;
  pendingMovements: number;
  completedMovements: number;
  totalValue: number;
  activeIncidents: number;
  resolvedIncidents: number;
}

interface LogisticsSummaryStatsSectionProps {
  stats: SummaryStats;
}

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export const LogisticsSummaryStatsSection: React.FC<LogisticsSummaryStatsSectionProps> = ({ stats }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const statCards: StatCard[] = [
    {
      title: 'Total de Movimientos',
      value: formatNumber(stats.totalMovements),
      icon: TruckIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Movimientos Pendientes',
      value: formatNumber(stats.pendingMovements),
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '-8%',
      changeType: 'positive'
    },
    {
      title: 'Movimientos Completados',
      value: formatNumber(stats.completedMovements),
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Valor Total Operado',
      value: formatCurrency(stats.totalValue),
      icon: CurrencyDollarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Incidencias Activas',
      value: formatNumber(stats.activeIncidents),
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '-2',
      changeType: 'positive'
    },
    {
      title: 'Incidencias Resueltas',
      value: formatNumber(stats.resolvedIncidents),
      icon: ShieldCheckIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+5',
      changeType: 'positive'
    }
  ];

  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Métricas Clave
        </h2>
        <p className="text-sm text-gray-600">
          Resumen de las principales métricas de operaciones logísticas del período actual.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-lg bg-white px-6 py-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </p>
                  {card.change && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      card.changeType === 'positive' 
                        ? 'bg-green-100 text-green-800'
                        : card.changeType === 'negative'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {card.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
            </div>
            
            {/* Progress indicator for some cards */}
            {(card.title.includes('Pendientes') || card.title.includes('Activas')) && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso</span>
                  <span>
                    {card.title.includes('Pendientes') 
                      ? `${Math.round((stats.completedMovements / stats.totalMovements) * 100)}%`
                      : `${Math.round((stats.resolvedIncidents / (stats.activeIncidents + stats.resolvedIncidents)) * 100)}%`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      card.title.includes('Pendientes') ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: card.title.includes('Pendientes') 
                        ? `${Math.round((stats.completedMovements / stats.totalMovements) * 100)}%`
                        : `${Math.round((stats.resolvedIncidents / (stats.activeIncidents + stats.resolvedIncidents)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional summary info */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Eficiencia</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round((stats.completedMovements / stats.totalMovements) * 100)}%
              </p>
            </div>
            <div className="text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900">Tasa de Resolución</p>
              <p className="text-2xl font-bold text-green-900">
                {Math.round((stats.resolvedIncidents / (stats.activeIncidents + stats.resolvedIncidents)) * 100)}%
              </p>
            </div>
            <div className="text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Valor Promedio</p>
              <p className="text-lg font-bold text-purple-900">
                {formatCurrency(stats.totalValue / stats.totalMovements)}
              </p>
            </div>
            <div className="text-purple-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 010 0L21.75 9M21.75 9H15M21.75 9v6.75" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-orange-900">2.3d</p>
            </div>
            <div className="text-orange-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};