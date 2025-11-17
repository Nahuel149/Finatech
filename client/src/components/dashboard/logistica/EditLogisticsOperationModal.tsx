import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { LogisticsOperation, LogisticsOperationUpdatePayload, OperationType } from '../../../types';
import { Alert } from '../../ui/Alert';
import { XMarkIcon } from '../../icons/HeroiconsOutline';

interface EditLogisticsOperationModalProps {
  isOpen: boolean;
  operation: LogisticsOperation | null;
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: LogisticsOperationUpdatePayload) => void;
}

type FormState = {
  contact: string;
  responsible: string;
  origin: string;
  destination: string;
  route: string;
  amountValue: string;
  amountCurrency: string;
  date: string;
  type: OperationType;
  notes: string;
};

const OPERATION_TYPE_OPTIONS: { label: string; value: OperationType }[] = [
  { label: 'Entrega', value: 'entrega' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Retiro', value: 'retiro' },
  { label: 'Custodia', value: 'custodia' },
];

const formatForInput = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoString = (value: string) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const buildInitialState = (operation: LogisticsOperation | null): FormState => ({
  contact: operation?.contact || '',
  responsible: operation?.responsible || '',
  origin: operation?.origin || '',
  destination: operation?.destination || '',
  route: operation?.route || '',
  amountValue: operation?.amount !== null && operation?.amount !== undefined ? String(operation.amount) : '',
  amountCurrency: operation?.currency || 'ARS',
  date: formatForInput(operation?.date),
  type: operation?.type || 'entrega',
  notes: operation?.notes || '',
});

export const EditLogisticsOperationModal: React.FC<EditLogisticsOperationModalProps> = ({
  isOpen,
  operation,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}) => {
  const [formState, setFormState] = useState<FormState>(buildInitialState(operation));

  useEffect(() => {
    if (isOpen) {
      setFormState(buildInitialState(operation));
    }
  }, [isOpen, operation]);

  const disableSubmit = useMemo(() => !operation || saving, [operation, saving]);

  if (!isOpen || !operation) {
    return null;
  }

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: LogisticsOperationUpdatePayload = {
      contact: formState.contact,
      responsible: formState.responsible,
      origin: formState.origin,
      destination: formState.destination,
      route: formState.route,
      type: formState.type,
      notes: formState.notes,
    };

    const isoDate = toIsoString(formState.date);
    if (isoDate) {
      payload.date = isoDate;
    }

    if (formState.amountValue || formState.amountCurrency) {
      const parsedValue = Number(formState.amountValue);
      payload.amount = {
        value: Number.isFinite(parsedValue) ? parsedValue : null,
        currency: formState.amountCurrency || 'ARS',
      };
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Editar movimiento</p>
            <h2 className="text-lg font-semibold text-text-primary">#{operation.operationCode}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Contacto
              <input
                type="text"
                value={formState.contact}
                onChange={handleChange('contact')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Responsable
              <input
                type="text"
                value={formState.responsible}
                onChange={handleChange('responsible')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Origen
              <input
                type="text"
                value={formState.origin}
                onChange={handleChange('origin')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Destino
              <input
                type="text"
                value={formState.destination}
                onChange={handleChange('destination')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Recorrido / Referencia
              <input
                type="text"
                value={formState.route}
                onChange={handleChange('route')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Monto (ARS)
              <input
                type="number"
                step="0.01"
                value={formState.amountValue}
                onChange={handleChange('amountValue')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Moneda
              <input
                type="text"
                value={formState.amountCurrency}
                onChange={handleChange('amountCurrency')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Fecha programada
              <input
                type="datetime-local"
                value={formState.date}
                onChange={handleChange('date')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Tipo de operación
              <select
                value={formState.type}
                onChange={handleChange('type')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {OPERATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Notas u observaciones
              <textarea
                value={formState.notes}
                onChange={handleChange('notes')}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          {errorMessage && (
            <div className="mt-4">
              <Alert type="error" message={errorMessage} />
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={disableSubmit}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                disableSubmit ? 'cursor-not-allowed bg-primary/60' : 'bg-primary hover:bg-blue-700'
              }`}
            >
              {saving ? 'Guardando cambios…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLogisticsOperationModal;
