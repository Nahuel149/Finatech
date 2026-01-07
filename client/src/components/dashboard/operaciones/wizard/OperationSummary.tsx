import React from 'react';

interface OperationSummaryProps {
  clientName?: string;
  operationLabel?: string;
  amountLabel?: string;
  amountDetails?: Array<{ label: string; value: string }>;
  onEdit?: () => void;
}

export const OperationSummary: React.FC<OperationSummaryProps> = ({
  clientName = '-',
  operationLabel = '-',
  amountLabel = '-',
  amountDetails = [],
  onEdit,
}) => {
  const hasDetails = amountDetails.length > 0;

  return (
    <div id="operation-summary" className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
      <div className="flex items-start justify-between">
        <div className="space-y-3 text-sm w-full">
          <div>
            <div className="text-sm text-gray-600">Cliente</div>
            <div className="font-medium text-text-primary text-base">{clientName}</div>
          </div>
          <div className="border-t border-gray-200 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Operacion</div>
              <div className="font-medium text-text-primary text-base">{operationLabel}</div>
            </div>
            {hasDetails
              ? amountDetails.map((detail) => (
                  <div key={detail.label} className="text-left sm:text-right lg:text-right">
                    <div className="text-sm text-gray-600">{detail.label}</div>
                    <div className="font-medium text-text-primary text-base">{detail.value}</div>
                  </div>
                ))
              : (
                <div className="text-left sm:text-right lg:text-right">
                  <div className="text-sm text-gray-600">Monto Total</div>
                  <div className="font-medium text-text-primary text-base">{amountLabel}</div>
                </div>
              )}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-primary hover:text-blue-700 text-sm transition-colors flex items-center ml-4"
        >
          <i className="fa-solid fa-edit mr-1" />
          Editar
        </button>
      </div>
    </div>
  );
};
