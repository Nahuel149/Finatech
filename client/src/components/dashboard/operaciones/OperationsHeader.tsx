import React from 'react';

interface Props {
  onTransferPesos: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ onTransferPesos }) => (
  <section id="operations-header" className="mb-6 lg:mb-8">
    <div className="mb-4 lg:mb-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">Operaciones</h1>
      <p className="text-gray-600 text-sm lg:text-base">
        Gestiona y supervisa todas las operaciones financieras
      </p>
    </div>

    <div
      id="header-actions"
      className="space-y-2 lg:space-y-0 lg:flex lg:items-center lg:space-x-3"
    >
      <button
        type="button"
        className="w-full lg:w-auto flex items-center justify-center px-4 py-3 lg:py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <i className="fa-solid fa-plus mr-2" />
        Nueva operación
      </button>
      <div className="grid grid-cols-2 gap-2 lg:flex lg:space-x-3">
        <button
          type="button"
          onClick={onTransferPesos}
          className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base"
        >
          <i className="fa-solid fa-paper-plane mr-2 text-xs lg:text-sm" />
          Transferir pesos
        </button>
        <button
          type="button"
          className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base"
        >
          <i className="fa-solid fa-file-invoice mr-2 text-xs lg:text-sm" />
          Ver cuentas corrientes
        </button>
      </div>
    </div>
  </section>
);
