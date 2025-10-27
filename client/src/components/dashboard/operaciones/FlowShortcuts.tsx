import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FlowShortcuts: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <section id="flow-shortcuts" className="mb-6 lg:mb-8">
      <div className="mb-4 lg:mb-6">
        <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-1 lg:mb-2">
          Atajos de flujo
        </h2>
        <p className="text-gray-600 text-sm lg:text-base">
          Accesos rápidos a operaciones frecuentes
        </p>
      </div>
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:gap-6">
        {[{
          id: 'shortcut-buy',
          title: 'Compra',
          subtitle: 'Entra Pesos',
          icon: 'fa-arrow-down',
          iconColor: 'text-success',
          iconBg: 'bg-success bg-opacity-10',
          description: 'Registra operación de compra de divisas con ingreso de pesos argentinos',
          onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=compra'),
        },
        {
          id: 'shortcut-sell',
          title: 'Venta',
          subtitle: 'Entra USD',
          icon: 'fa-arrow-up',
          iconColor: 'text-primary',
          iconBg: 'bg-primary bg-opacity-10',
          description: 'Registra operación de venta de divisas con ingreso de dólares estadounidenses',
          onClick: () => handleNavigate('/dashboard/operaciones/nueva?tipo=venta'),
        },
        {
          id: 'shortcut-compound',
          title: 'Liquidación',
          subtitle: 'Compuesta',
          icon: 'fa-layer-group',
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-500 bg-opacity-10',
          description: 'Procesa múltiples operaciones relacionadas en una sola liquidación',
          onClick: () => handleNavigate('/dashboard/operaciones/nueva'),
        },
        {
          id: 'shortcut-transfer',
          title: 'Transferencia en pesos',
          subtitle: 'Distribuí montos por contacto',
          icon: 'fa-money-bill-transfer',
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500 bg-opacity-10',
          description: 'Registrá el envío o recepción de pesos argentinos distribuyendo entre múltiples contactos.',
          onClick: () => handleNavigate('/dashboard/operaciones/transfer-pesos'),
        }].map((shortcut) => (
          <div
            key={shortcut.id}
            id={shortcut.id}
            onClick={shortcut.onClick}
            className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-3 lg:mb-4">
              <div
                className={`w-10 h-10 lg:w-12 lg:h-12 ${shortcut.iconBg} rounded-lg flex items-center justify-center mr-3 lg:mr-4 group-hover:bg-opacity-20 transition-colors`}
              >
                <i className={`fa-solid ${shortcut.icon} ${shortcut.iconColor} text-sm lg:text-xl`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary text-base lg:text-lg">
                  {shortcut.title}
                </h3>
                <p className="text-xs text-gray-600">{shortcut.subtitle}</p>
              </div>
              <i className="fa-solid fa-arrow-right text-primary text-sm" />
            </div>
            <p className="text-gray-600 text-sm lg:text-base">
              {shortcut.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
