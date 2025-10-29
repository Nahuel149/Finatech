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
        <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-2">Atajos de flujo</h2>
        <p className="text-gray-600 text-sm lg:text-base">Accesos rápidos a operaciones frecuentes</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {[
          {
            id: 'shortcut-buy',
            title: 'Compra',
            subtitle: 'Egreso ARS',
            icon: 'fa-arrow-down',
            iconColor: 'text-success',
            iconBg: 'bg-success bg-opacity-10',
            description:
              'Registra operación de compra de divisas con egreso de pesos argentinos',
            cta: 'Iniciar operación',
            onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=compra'),
          },
          {
            id: 'shortcut-sell',
            title: 'Venta',
            subtitle: 'Ingreso ARS',
            icon: 'fa-arrow-up',
            iconColor: 'text-primary',
            iconBg: 'bg-primary bg-opacity-10',
            description:
              'Registra operación de venta de divisas con ingreso de pesos argentinos',
            cta: 'Iniciar operación',
            onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=venta'),
          },
          {
            id: 'shortcut-transfer-pesos',
            title: 'Transferencia en pesos',
            subtitle: 'Envía o recibe pesos',
            icon: 'fa-layer-group',
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-500 bg-opacity-10',
            description: 'Entrante, saliente, distribución entre contactos',
            cta: 'Iniciar proceso',
            onClick: () => handleNavigate('/dashboard/operaciones/transfer-pesos'),
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
            className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-3 lg:mb-4">
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 ${shortcut.iconBg} rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-opacity-20 transition-colors`}
              >
                <i className={`fa-solid ${shortcut.icon} ${shortcut.iconColor} text-lg lg:text-xl`} />
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-text-primary">{shortcut.title}</h3>
                <p className="text-xs lg:text-sm text-gray-600">{shortcut.subtitle}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-3 lg:mb-4 text-sm lg:text-base">{shortcut.description}</p>
            <div className="flex items-center text-primary text-xs lg:text-sm font-medium">
              {shortcut.cta}
              <i className="fa-solid fa-arrow-right ml-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
