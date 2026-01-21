import React, { useEffect, useState } from 'react';
import { RevertTreasuryReceptionPayload, TreasuryReception } from '../../../../types/treasuryReceptions';
import { Modal } from '../../../ui/Modal';

interface Props {
  open: boolean;
  reception: TreasuryReception | null;
  loading: boolean;
  onClose: () => void;
  onRevert: (payload: RevertTreasuryReceptionPayload) => Promise<void> | void;
}

export const RevertReceptionModal: React.FC<Props> = ({
  open,
  reception,
  loading,
  onClose,
  onRevert,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onRevert({ reason: reason.trim() || undefined });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Revertir recepción" size="lg">
      {!reception ? (
        <p className="text-sm text-gray-500">No hay recepción seleccionada.</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <p className="font-semibold mb-1">Esta acción revertirá los asientos contables generados.</p>
            <p>
              La orden volverá a estado pendiente para Tesorería (CA7). Sólo usuarios supervisores deben ejecutar esta
              reversión.
            </p>
          </div>

          <div>
            <label htmlFor="revert-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de reversión (opcional)
            </label>
            <textarea
              id="revert-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Ej: Recepción confirmada por error, se volverá a revisar"
            />
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Revirtiendo…' : 'Revertir recepción'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
