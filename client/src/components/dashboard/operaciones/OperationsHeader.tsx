import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onTransferPesos: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ onTransferPesos }) => {
  const navigate = useNavigate();

  const handleNuevaOperacion = () => {
    navigate('/dashboard/operaciones/nueva?tipo=compra');
  };

  const handleTransferirPesos = () => {
    navigate('/dashboard/operaciones/transfer-pesos');
  };

  const handleVerCuentasCorrientes = () => {
    navigate('/dashboard/tesoreria/saldos?account=cash-ars');
  };

  return (
  <section id="operations-header" className="mb-8">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
      <div className="hidden lg:block">
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">Operaciones</h1>
        <p className="text-gray-600 text-sm lg:text-base">Gestiona y supervisa todas las operaciones financieras</p>
      </div>
      
      {/* Desktop Layout */}
      <div id="header-actions" className="hidden lg:flex lg:items-center lg:space-x-4">
        <button
          type="button"
          onClick={handleNuevaOperacion}
          className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <i className="fa-solid fa-plus mr-2" />
          Nueva operación
        </button>
        <button
          type="button"
          onClick={handleTransferirPesos}
          className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <i className="fa-solid fa-paper-plane mr-2" />
          Transferir pesos
        </button>
        <button
          type="button"
          onClick={handleVerCuentasCorrientes}
          className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <i className="fa-solid fa-file-invoice mr-2" />
          Ver cuentas corrientes
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={handleNuevaOperacion}
          className="flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <i className="fa-solid fa-plus mr-2" />
          Nueva operación
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleTransferirPesos}
            className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <i className="fa-solid fa-paper-plane mr-1" />
            Transferir pesos
          </button>
          <button
            type="button"
            onClick={handleVerCuentasCorrientes}
            className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <i className="fa-solid fa-file-invoice mr-1" />
            Ver cuentas corrientes
          </button>
        </div>
      </div>
    </div>
  </section>
  );
};
