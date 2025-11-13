import React, { useEffect, useMemo, useState } from 'react';
import { ConfirmTreasuryReceptionPayload, TreasuryReception } from '../../../../types';
import { Modal } from '../../../ui';
import { formatCurrency } from '../../operaciones/transfer/utils';
import { ensureCurrencyTotals } from './receptionUtils';

interface Props {
  open: boolean;
  reception: TreasuryReception | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payload: ConfirmTreasuryReceptionPayload) => Promise<void> | void;
}

export const ConfirmReceptionModal: React.FC<Props> = ({
  open,
  reception,
  loading,
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setNotes('');
    }
  }, [open]);

  const totals = useMemo(() => (reception ? ensureCurrencyTotals(reception) : []), [reception]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onConfirm({ notes: notes.trim() || undefined });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Confirmar recepción" size="lg">
      {!reception ? (
        <p className="text-sm text-gray-500">Seleccioná una recepción para continuar.</p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600">
            Confirmá que los valores recibidos fueron acreditados en Tesorería. Esta acción genera el asiento
            contable correspondiente y actualiza los saldos (CA3).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {totals.map((total) => (
              <div key={`${reception.id}-${total.currency}`} className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs uppercase text-gray-500">{total.currency}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(total.receivedAmount || 0, total.currency)}
                </p>
                <p className="text-xs text-gray-500">
                  Esperado {formatCurrency(total.expectedAmount || 0, total.currency)}
                </p>
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="confirm-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              id="confirm-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Ej: Impactado en Caja ARS"
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
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Confirmando…' : 'Confirmar recepción'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
