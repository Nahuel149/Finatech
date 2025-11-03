import React from 'react';

// Pequeño componente auxiliar para el resumen
const SummaryItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

interface Props {
  operationCode: string;
  // Funciones de botones
  onViewDetails: () => void;
  onBackToOperations: () => void;
  onNewOperation: () => void;
  onExportPDF: () => void;
  onDuplicate: () => void;
  onVoid?: () => void;
  canVoid?: boolean;

  // Datos para el resumen breve
  clientName: string;
  clientDocument?: string | null;
  operationType: 'buy' | 'sell';
  settlementMode: 'simple' | 'compound';
  incomingAmountLabel: string; // Ej: "USD 1.250,00"
  incomingAssetLabel: string; // Ej: "(Billete)"
  outgoingAmountLabel: string; // Ej: "ARS $125.000,00"
  outgoingAssetLabel: string;
  operationRate: number;
}

export const CompletionSuccessState: React.FC<Props> = ({
  operationCode,
  onViewDetails,
  onBackToOperations,
  onNewOperation,
  onExportPDF,
  onDuplicate,
  onVoid,
  canVoid = true,
  clientName,
  clientDocument,
  operationType,
  settlementMode,
  incomingAmountLabel,
  incomingAssetLabel,
  outgoingAmountLabel,
  outgoingAssetLabel,
  operationRate,
}) => {
  const clientReceives = operationType === 'buy'
    ? { amount: incomingAmountLabel, asset: incomingAssetLabel }
    : { amount: outgoingAmountLabel, asset: outgoingAssetLabel };
  const clientPays = operationType === 'buy'
    ? { amount: outgoingAmountLabel, asset: outgoingAssetLabel }
    : { amount: incomingAmountLabel, asset: incomingAssetLabel };

  return (
  <section
    id="success-card"
    className="bg-white rounded-lg border border-gray-200 shadow-lg"
  >
    {/* 1. Success Header */}
    <div
      id="success-header"
      className="text-center py-12 px-8 border-b border-gray-200"
    >
      <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 check-animation">
        <i className="fa-solid fa-check text-white text-3xl" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary mb-3">
        Operación registrada con éxito
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        La operación ha sido guardada correctamente en el sistema.
      </p>
      <div className="inline-flex items-center px-6 py-3 bg-primary bg-opacity-10 rounded-full">
        <i className="fa-solid fa-hashtag text-primary mr-2"></i>
        <span className="text-2xl font-bold text-primary">{operationCode}</span>
      </div>
    </div>

    {/* 2. Brief Summary */}
    <div id="brief-summary" className="p-8">
      <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center">
        <i className="fa-solid fa-file-invoice mr-2 text-primary"></i>
        Resumen de la operación
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          <SummaryItem label="Cliente">
            <div className="text-text-primary font-medium">{clientName}</div>
            {clientDocument && (
              <div className="text-sm text-gray-500">{clientDocument}</div>
            )}
          </SummaryItem>

          <SummaryItem label="Tipo de operación">
            <div className="flex items-center">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  operationType === 'buy'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {operationType === 'buy' ? (
                  <i className="fa-solid fa-arrow-down mr-1" />
                ) : (
                  <i className="fa-solid fa-arrow-up mr-1" />
                )}
                {operationType === 'buy' ? 'Compra' : 'Venta'}
              </span>
            </div>
          </SummaryItem>

          <SummaryItem label="Tipo de liquidación">
            <div className="flex items-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <i
                  className={`fa-solid ${
                    settlementMode === 'compound'
                      ? 'fa-layer-group'
                      : 'fa-stream'
                  } mr-1`}
                />
                {settlementMode === 'compound' ? 'Compuesta' : 'Simple'}
              </span>
            </div>
         </SummaryItem>
        </div>

        <div className="space-y-4">
          <SummaryItem label="Cliente recibe">
            <div className="text-text-primary font-medium">
              {clientReceives.amount}
            </div>
            <div className="text-sm text-gray-500">({clientReceives.asset})</div>
          </SummaryItem>

          <SummaryItem label="Cliente paga">
            <div className="text-text-primary font-medium">
              {clientPays.amount}
            </div>
            {operationRate !== undefined && operationRate !== null ? (
              <div className="text-sm text-gray-500">
                TC: ${operationRate.toFixed(2)}
              </div>
            ) : (
              <div className="text-sm text-gray-500">TC: —</div>
            )}
          </SummaryItem>
        </div>
      </div>
    </div>

    {/* 3. Primary Actions */}
    <div
      id="primary-actions"
      className="px-8 py-6 bg-gray-50 border-t border-gray-200"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onViewDetails}
          className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
        >
          <i className="fa-solid fa-eye mr-2" />
          Ver detalle de operación
        </button>
        <button
          onClick={onBackToOperations}
          className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium w-full sm:w-auto"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Volver a Operaciones
        </button>
        <button
          onClick={onNewOperation}
          className="px-6 py-3 text-primary hover:text-blue-700 transition-colors font-medium w-full sm:w-auto"
        >
          <i className="fa-solid fa-plus mr-2" />
          Nueva operación
        </button>
      </div>
    </div>

    {/* 4. Secondary Actions */}
    <div id="secondary-actions" className="px-8 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:space-x-6">
        {onVoid && (
          <button
            onClick={onVoid}
            className="flex items-center px-4 py-2 text-danger hover:text-red-700 transition-colors"
            disabled={!canVoid}
          >
            <i className="fa-solid fa-ban mr-2" />
            Anular operación
          </button>
        )}
        <button
          onClick={onExportPDF}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-text-primary transition-colors"
        >
          <i className="fa-solid fa-file-pdf mr-2" />
          Exportar resumen (PDF)
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-text-primary transition-colors"
        >
          <i className="fa-solid fa-copy mr-2" />
          Duplicar operación
        </button>
      </div>
    </div>
  </section>
);
};
