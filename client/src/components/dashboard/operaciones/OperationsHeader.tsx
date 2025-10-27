import React from 'react';

interface Props {
  onTransferPesos: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ onTransferPesos }) => (
  <section id="operations-header" className="mb-8">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Operaciones</h1>
        <p className="text-gray-600">Gestiona y supervisa todas las operaciones financieras</p>
      </div>
      <div id="header-actions" className="flex space-x-3">
        <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
          <i className="fa-solid fa-plus mr-2"></i>
          Nueva operación
        </button>
        <button onClick={onTransferPesos} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors">
          <i className="fa-solid fa-paper-plane mr-2"></i>
          Transferir pesos
        </button>
        <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors">
          <i className="fa-solid fa-file-invoice mr-2"></i>
          Ver cuentas corrientes
        </button>
      </div>
    </div>
  </section>
);