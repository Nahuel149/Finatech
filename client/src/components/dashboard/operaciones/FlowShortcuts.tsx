import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FlowShortcuts: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <section id="flow-shortcuts" className="mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-2">Atajos de flujo</h2>
        <p className="text-gray-600">Accesos rápidos a operaciones frecuentes</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {[
          {
            id: 'shortcut-buy',
            title: 'Compra',
            subtitle: 'Entra Pesos',
            icon: 'fa-arrow-down',
            iconColor: 'text-success',
            iconBg: 'bg-success bg-opacity-10',
            description:
              'Registra operación de compra de divisas con ingreso de pesos argentinos',
            cta: 'Iniciar operación',
            onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=compra'),
          },
          {
            id: 'shortcut-sell',
            title: 'Venta',
            subtitle: 'Entra USD',
            icon: 'fa-arrow-up',
            iconColor: 'text-primary',
            iconBg: 'bg-primary bg-opacity-10',
            description:
              'Registra operación de venta de divisas con ingreso de dólares estadounidenses',
            cta: 'Iniciar operación',
            onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=venta'),
          },
          {
            id: 'shortcut-compound',
            title: 'Liquidación',
            subtitle: 'Compuesta',
            icon: 'fa-layer-group',
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-500 bg-opacity-10',
            description:
              'Procesa múltiples operaciones relacionadas en una sola liquidación',
            cta: 'Iniciar proceso',
            onClick: () => handleNavigate('/dashboard/operaciones/nueva'),
          },
        ].map((shortcut) => (
          <div
            key={shortcut.id}
            id={shortcut.id}
            role="button"
            tabIndex={0}
            onClick={shortcut.onClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                shortcut.onClick();
              }
            }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-4">
              <div
                className={`w-12 h-12 ${shortcut.iconBg} rounded-lg flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-colors`}
              >
                <i className={`fa-solid ${shortcut.icon} ${shortcut.iconColor} text-xl`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{shortcut.title}</h3>
                <p className="text-sm text-gray-600">{shortcut.subtitle}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{shortcut.description}</p>
            <div className="flex items-center text-primary text-sm font-medium">
              {shortcut.cta}
              <i className="fa-solid fa-arrow-right ml-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
