import React, { useState } from 'react';
import { ApiError, LogisticsDiscrepancyPayload } from '../../../types';
import { Modal } from '../../ui/Modal';
import { Alert } from '../../ui/Alert';

const DISCREPANCY_REASONS = [
  { value: 'faltante', label: 'Faltante de valores' },
  { value: 'sobrante', label: 'Sobrante detectado' },
  { value: 'rechazo', label: 'Contraparte rechazó la entrega' },
  { value: 'documentacion', label: 'Documentación inconsistente' },
  { value: 'otros', label: 'Otro incidente' },
];

interface DiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: LogisticsDiscrepancyPayload) => Promise<void>;
  loading?: boolean;
  error?: ApiError | null;
}

export const DiscrepancyModal: React.FC<DiscrepancyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error,
}) => {
  const [reason, setReason] = useState(DISCREPANCY_REASONS[0].value);
  const [description, setDescription] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      reason,
      description,
    });
    setDescription('');
    setReason(DISCREPANCY_REASONS[0].value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reportar discrepancia" size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">
          Esta acción bloquea el cierre de la orden hasta que Tesorería resuelva el incidente. Incluí toda la
          información relevante y adjuntá evidencias desde la sección principal.
        </p>

        <label className="block text-sm font-medium text-gray-700">
          Motivo
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            disabled={loading}
          >
            {DISCREPANCY_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Descripción
          <textarea
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detallá qué ocurrió, qué valores están involucrados y si hubo intervención de la contraparte."
            required
            disabled={loading}
          />
        </label>

        {error && (
          <Alert type="error" message={error.message} />
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            disabled={loading}
          >
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            Reportar discrepancia
          </button>
        </div>
      </form>
    </Modal>
  );
};

