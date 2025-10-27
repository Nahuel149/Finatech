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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Compra */}
        <div
          id="shortcut-buy"
          onClick={() => handleNavigate('/dashboard/operaciones/nueva?tipo=compra')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow transform hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-success bg-opacity-10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-colors">
              <i className="fa-solid fa-arrow-down text-success text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Compra</h3>
              <p className="text-sm text-gray-600">Entra Pesos</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Registra operación de compra de divisas con ingreso de pesos argentinos
          </p>
          <div className="flex items-center text-primary text-sm font-medium">
            Iniciar operación
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </div>
        </div>

        {/* Venta */}
        <div
          id="shortcut-sell"
          onClick={() => handleNavigate('/dashboard/operaciones/nueva?tipo=venta')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow transform hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-colors">
              <i className="fa-solid fa-arrow-up text-primary text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Venta</h3>
              <p className="text-sm text-gray-600">Entra USD</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Registra operación de venta de divisas con ingreso de dólares estadounidenses
          </p>
          <div className="flex items-center text-primary text-sm font-medium">
            Iniciar operación
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </div>
        </div>

        {/* Liquidación compuesta */}
        <div
          id="shortcut-compound"
          onClick={() => handleNavigate('/dashboard/operaciones/nueva')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow transform hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-colors">
              <i className="fa-solid fa-layer-group text-orange-500 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Liquidación</h3>
              <p className="text-sm text-gray-600">Compuesta</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Procesa múltiples operaciones relacionadas en una sola liquidación
          </p>
          <div className="flex items-center text-primary text-sm font-medium">
            Iniciar proceso
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </div>
        </div>

        {/* Transferencia en pesos */}
        <div
          id="shortcut-transfer"
          onClick={() => handleNavigate('/dashboard/operaciones/transfer-pesos')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow transform hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-opacity-20 transition-colors">
              <i className="fa-solid fa-money-bill-transfer text-blue-500 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Transferencia en pesos</h3>
              <p className="text-sm text-gray-600">Distribuí montos por contacto</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Registrá el envío o recepción de pesos argentinos distribuyendo entre múltiples contactos.
          </p>
          <div className="flex items-center text-primary text-sm font-medium">
            Iniciar flujo
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </div>
        </div>
      </div>
    </section>
  );
};
