import React from 'react';
import { CheckCircleIcon, XMarkIcon } from '../../icons/HeroiconsOutline';

interface CompletionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  movementId: string;
  movementType?: string;
  reference?: string;
}

const CompletionConfirmationModal: React.FC<CompletionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  movementId,
  movementType = 'Movimiento logístico',
  reference
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Confirmar finalización
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            ¿Estás seguro que querés marcar este movimiento como completado?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">ID del movimiento:</span>
                <span className="text-sm text-gray-900">{movementId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Tipo de movimiento:</span>
                <span className="text-sm text-gray-900">{movementType}</span>
              </div>
              {reference && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Referencia:</span>
                  <span className="text-sm text-gray-900">{reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Fecha:</span>
                <span className="text-sm text-gray-900">
                  {new Date().toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Una vez registrado, el movimiento no podrá ser eliminado, 
              solo modificado en ciertos campos según el estado del movimiento.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirmar registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionConfirmationModal;