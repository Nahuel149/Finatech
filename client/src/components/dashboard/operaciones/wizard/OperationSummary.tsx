import React from 'react';

interface OperationSummaryProps {
  clientName?: string;
  operationLabel?: string;
  amountLabel?: string;
  onEdit?: () => void;
}

export const OperationSummary: React.FC<OperationSummaryProps> = ({
  clientName = '—',
  operationLabel = '—',
  amountLabel = '—',
  onEdit,
}) => (
  <div id="operation-summary" className="bg-gray-50 rounded-lg p-4 mb-8">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center text-sm sm:space-x-6 space-y-4 sm:space-y-0">
        <div>
          <div className="text-sm text-gray-600">Cliente</div>
          <div className="font-medium text-text-primary text-base">{clientName}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div>
          <div className="text-sm text-gray-600">Operación</div>
          <div className="font-medium text-text-primary text-base">{operationLabel}</div>
        </div>
        <div className="hidden sm:block h-8 w-px bg-gray-300" />
        <div>
          <div className="text-sm text-gray-600">Monto Total</div>
          <div className="font-medium text-text-primary text-base">{amountLabel}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-primary hover:text-blue-700 text-sm transition-colors flex items-center mt-4 sm:mt-0"
      >
        <i className="fa-solid fa-edit mr-1" />
        Editar datos
      </button>
    </div>
  </div>
);
