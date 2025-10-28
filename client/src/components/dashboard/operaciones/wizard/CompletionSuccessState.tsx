import React from 'react';

interface Props {
  operationCode: string;
  onViewDetails: () => void;
  onNewOperation: () => void;
  onVoid?: () => void;
  disableVoid?: boolean;
}

export const CompletionSuccessState: React.FC<Props> = ({
  operationCode,
  onViewDetails,
  onNewOperation,
  onVoid,
  disableVoid = false,
}) => (
  <div
    id="success-state"
    className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center"
  >
    <div className="w-20 h-20 bg-success bg-opacity-10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
      <i className="fa-solid fa-circle-check text-4xl" />
    </div>
    <h2 className="text-3xl font-bold text-text-primary mb-3">Operación registrada con éxito</h2>
    <p className="text-gray-600 mb-6">
      La operación fue confirmada y enviada a Tesorería para su seguimiento. Recordá cargar el
      movimiento correspondiente al acreditarse los fondos.
    </p>
    <div className="inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 mb-8">
      ID operación <span className="font-semibold text-text-primary ml-2">{operationCode}</span>
    </div>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
      <button
        type="button"
        onClick={onViewDetails}
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <i className="fa-solid fa-receipt mr-2" />
        Ver detalle de la operación
      </button>
      <button
        type="button"
        onClick={onNewOperation}
        className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
      >
        <i className="fa-solid fa-plus mr-2" />
        Registrar otra operación
      </button>
      {onVoid && (
        <button
          type="button"
          onClick={onVoid}
          disabled={disableVoid}
          className="px-6 py-3 bg-white border border-danger/40 text-danger rounded-lg hover:bg-danger/5 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-ban mr-2" />
          Anular operación
        </button>
      )}
    </div>
  </div>
);
