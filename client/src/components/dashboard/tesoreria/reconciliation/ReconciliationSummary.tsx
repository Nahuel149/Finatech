import React from 'react';

interface Props {
  operationsCount: number;
  movementsCount: number;
  operationsTotalLabel: string;
  movementTotalLabel: string;
  differenceLabel: string;
  isBalanced: boolean;
  warning?: string | null;
  disableConfirm: boolean;
  confirming: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onConfirm: () => void;
}

export const ReconciliationSummary: React.FC<Props> = ({
  operationsCount,
  movementsCount,
  operationsTotalLabel,
  movementTotalLabel,
  differenceLabel,
  isBalanced,
  warning,
  disableConfirm,
  confirming,
  onCancel,
  onSaveDraft,
  onConfirm,
}) => (
  <div id="reconciliation-summary" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 z-40">
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Operaciones seleccionadas</div>
          <div className="text-xl font-bold text-text-primary">{operationsCount}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Movimientos seleccionados</div>
          <div className="text-xl font-bold text-text-primary">{movementsCount}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Total operaciones</div>
          <div className="text-xl font-bold text-text-primary">{operationsTotalLabel}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Total movimientos</div>
          <div className="text-xl font-bold text-text-primary">{movementTotalLabel}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Diferencia</div>
          <div className={`text-xl font-bold ${isBalanced ? 'text-success' : 'text-danger'}`}>
            {differenceLabel}
          </div>
          <div className={`text-xs mt-1 ${isBalanced ? 'text-success' : 'text-danger'}`}>
            {isBalanced ? 'Listo para compensar' : 'Revisá los montos seleccionados'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {warning ? (
          <div id="reconciliation-warning" className="flex items-center text-warning">
            <i className="fa-solid fa-exclamation-triangle mr-2" />
            <span className="text-sm">{warning}</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center space-x-4 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={disableConfirm}
          >
            <span>{confirming ? 'Compensando…' : 'Confirmar compensación'}</span>
            {confirming && <i className="fa-solid fa-spinner fa-spin ml-2" />}
          </button>
        </div>
      </div>
    </div>
  </div>
);
