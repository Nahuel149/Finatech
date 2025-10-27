import React from 'react';
import { Modal } from '../../../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelOperationModal: React.FC<Props> = ({ open, onClose, onConfirm }) => (
  <Modal isOpen={open} onClose={onClose} title="Cancelar operación" size="md">
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger bg-opacity-10 text-danger flex items-center justify-center mr-3">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-text-primary mb-1">¿Seguro que querés cancelar?</h4>
          <p className="text-sm text-gray-600">
            La operación quedará sin efecto y podrás retomarla desde la lista de borradores si lo necesitás.
          </p>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <i className="fa-solid fa-circle-info text-gray-500 mr-2" />
        Se conservará el borrador por 30 días para consultas o seguimiento.
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Continuar editando
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <i className="fa-solid fa-ban mr-2" />
          Cancelar operación
        </button>
      </div>
    </div>
  </Modal>
);
