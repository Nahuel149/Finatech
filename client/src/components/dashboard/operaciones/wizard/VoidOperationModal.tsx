import React, { useEffect, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { Alert } from '../../../ui/Alert';

interface Props {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const VoidOperationModal: React.FC<Props> = ({ open, loading = false, error = null, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  return (
    <Modal isOpen={open} onClose={onClose} title="Anular operación" size="md">
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
            <i className="fa-solid fa-rotate-left" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-1">¿Confirmás la anulación?</h4>
            <p className="text-sm text-gray-600">
              La operación volverá al estado "Anulada" y sus movimientos contables se revertirán automáticamente. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="void-reason" className="block text-sm font-medium text-text-primary mb-2">
            Motivo (opcional)
          </label>
          <textarea
            id="void-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full h-24 rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ej. Error de datos cargados"
            disabled={loading}
            maxLength={500}
          />
          <p className="mt-1 text-xs text-gray-500">Hasta 500 caracteres.</p>
        </div>

        {error && <Alert type="error" message={error} />}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Conservar operación
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Anulando…
              </>
            ) : (
              <>
                <i className="fa-solid fa-ban mr-2" />
                Anular operación
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
