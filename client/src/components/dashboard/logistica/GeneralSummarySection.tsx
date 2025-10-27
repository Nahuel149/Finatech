import React from 'react';
import {
  ClockIcon,
  TruckIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
} from '../../icons/HeroiconsOutline';

interface SummaryCard {
  id: string;
  title: string;
  count: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
}

export const GeneralSummarySection: React.FC = () => {
  const summaryData: SummaryCard[] = [
    {
      id: 'active-operations',
      title: 'Operaciones activas',
      count: 12,
      description: 'En proceso de gestión',
      icon: ClockIcon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      id: 'pending-deliveries',
      title: 'Entregas pendientes',
      count: 8,
      description: 'Programadas para hoy',
      icon: TruckIcon,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      id: 'internal-transfers',
      title: 'Transferencias internas',
      count: 5,
      description: 'Entre sucursales',
      icon: ArrowsRightLeftIcon,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      id: 'completed-today',
      title: 'Completadas hoy',
      count: 23,
      description: 'Operaciones finalizadas',
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    }
  ];

  const handleCardClick = (cardId: string) => {
    // Navigate to detailed view based on card type
    window.location.href = '/dashboard/logistica/resumen-general';
  };

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Resumen general</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <article
              key={card.id}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCardClick(card.id)}
              aria-label="Ver resumen general"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mb-2">
                    {card.count}
                  </p>
                  <p className="text-xs text-gray-500">
                    {card.description}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
