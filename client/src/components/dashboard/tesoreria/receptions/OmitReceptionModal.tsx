import React, { useEffect, useState } from 'react';
import { OmitTreasuryReceptionPayload, TreasuryReception } from '../../../../types';
import { Modal } from '../../../ui';

interface Props {
  open: boolean;
  reception: TreasuryReception | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: OmitTreasuryReceptionPayload) => Promise<void> | void;
}

export const OmitReceptionModal: React.FC<Props> = ({ open, reception, loading, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setNotes('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('El motivo es obligatorio para omitir la recepción (CA5).');
      return;
    }
    setError(null);
    onSubmit({ reason: reason.trim(), notes: notes.trim() || undefined });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Omitir impacto contable" size="lg">
      {!reception ? (
        <p className="text-sm text-gray-500">Seleccioná una recepción válida.</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
            <p className="font-semibold mb-1">Esta acción no generará ningún asiento contable.</p>
            <p>
              Registraremos el motivo y cerraremos la recepción para auditoría (CA4 y CA5). Usalo sólo si los valores
              se utilizaron inmediatamente en otra operación.
            </p>
          </div>

          <div>
            <label htmlFor="omit-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de omisión
            </label>
            <textarea
              id="omit-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Ej: Valores utilizados para entrega directa a contacto XYZ"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <div>
            <label htmlFor="omit-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas internas (opcional)
            </label>
            <textarea
              id="omit-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={2}
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
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Omitir impacto'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
