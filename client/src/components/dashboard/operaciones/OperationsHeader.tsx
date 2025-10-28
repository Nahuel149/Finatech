import React from 'react';

interface Props {
  onTransferPesos: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ onTransferPesos }) => (
  <section id="operations-header" className="mb-8">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Operaciones</h1>
        <p className="text-gray-600">Gestiona y supervisa todas las operaciones financieras</p>
      </div>
      <div id="header-actions" className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
        <button
          type="button"
          className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2" />
          Nueva operación
        </button>
        <button
          type="button"
          onClick={onTransferPesos}
          className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="fa-solid fa-paper-plane mr-2" />
          Transferir pesos
        </button>
        <button
          type="button"
          className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="fa-solid fa-file-invoice mr-2" />
          Ver cuentas corrientes
        </button>
      </div>
    </div>
  </section>
);
