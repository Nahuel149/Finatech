import React, { FormEvent, useEffect, useState } from 'react';
import { LogisticsOperation, LogisticsOperationUpdatePayload, OperationType } from '../../../types/logistics';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import { Alert } from '../../ui/Alert';

interface BulkEditLogisticsOperationsModalProps {
  isOpen: boolean;
  operations: LogisticsOperation[];
  saving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (payload: LogisticsOperationUpdatePayload) => void;
}

type FormField =
  | 'contact'
  | 'responsible'
  | 'origin'
  | 'destination'
  | 'route'
  | 'amountValue'
  | 'amountCurrency'
  | 'date'
  | 'type'
  | 'notes';

type FormState = Record<FormField, string>;

const defaultState: FormState = {
  contact: '',
  responsible: '',
  origin: '',
  destination: '',
  route: '',
  amountValue: '',
  amountCurrency: 'ARS',
  date: '',
  type: '',
  notes: '',
};

const OPERATION_TYPE_OPTIONS: { label: string; value: OperationType }[] = [
  { label: 'Entrega', value: 'entrega' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Retiro', value: 'retiro' },
  { label: 'Custodia', value: 'custodia' },
];

const toIsoString = (value: string) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const BulkEditLogisticsOperationsModal: React.FC<BulkEditLogisticsOperationsModalProps> = ({
  isOpen,
  operations,
  saving,
  errorMessage,
  onClose,
  onSubmit,
}) => {
  const [formState, setFormState] = useState<FormState>(defaultState);
  const [dirtyFields, setDirtyFields] = useState<Set<FormField>>(new Set());
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState({ ...defaultState });
      setDirtyFields(new Set());
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen || operations.length === 0) {
    return null;
  }

  const preview = operations.slice(0, 4);
  const remaining = Math.max(0, operations.length - preview.length);

  const handleChange = (field: FormField) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setDirtyFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!dirtyFields.size) {
      setLocalError('Seleccioná al menos un campo para actualizar masivamente.');
      return;
    }

    const payload: LogisticsOperationUpdatePayload = {};

    if (dirtyFields.has('contact')) {
      payload.contact = formState.contact;
    }
    if (dirtyFields.has('responsible')) {
      payload.responsible = formState.responsible;
    }
    if (dirtyFields.has('origin')) {
      payload.origin = formState.origin;
    }
    if (dirtyFields.has('destination')) {
      payload.destination = formState.destination;
    }
    if (dirtyFields.has('route')) {
      payload.route = formState.route;
    }
    if (dirtyFields.has('notes')) {
      payload.notes = formState.notes;
    }
    if (dirtyFields.has('type')) {
      if (!formState.type) {
        setLocalError('Seleccioná un tipo de operación válido.');
        return;
      }
      payload.type = formState.type as OperationType;
    }
    if (dirtyFields.has('date')) {
      const isoDate = toIsoString(formState.date);
      if (!isoDate) {
        setLocalError('Ingresá una fecha válida.');
        return;
      }
      payload.date = isoDate;
    }
    if (dirtyFields.has('amountValue') || dirtyFields.has('amountCurrency')) {
      if (!formState.amountValue.trim()) {
        setLocalError('Ingresá un monto válido para actualizar el importe.');
        return;
      }
      const parsedValue = Number(formState.amountValue);
      payload.amount = {
        value: Number.isFinite(parsedValue) ? parsedValue : null,
        currency: formState.amountCurrency || 'ARS',
      };
    }

    if (Object.keys(payload).length === 0) {
      setLocalError('Seleccioná al menos un campo para actualizar masivamente.');
      return;
    }

    onSubmit(payload);
  };

  const dirtyCount = dirtyFields.size;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Edición masiva</p>
            <h2 className="text-lg font-semibold text-text-primary">
              Actualizar {operations.length} operaciones logísticas
            </h2>
            <p className="text-sm text-gray-500">Solo se modificarán los campos que ajustes en este formulario.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Cerrar"
            disabled={saving}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-text-primary">Operaciones incluidas</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {preview.map((operation) => (
                <li key={operation.id} className="flex items-center gap-2">
                  <i className="fa-solid fa-hashtag text-gray-400" />
                  {operation.operationCode}
                </li>
              ))}
              {remaining > 0 && <li className="text-xs text-gray-500">+ {remaining} operaciones adicionales</li>}
            </ul>
          </div>

          {(localError || errorMessage) && (
            <Alert type="error" message={localError || errorMessage || ''} />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Contacto
              <input
                type="text"
                value={formState.contact}
                onChange={handleChange('contact')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Nuevo contacto"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Responsable
              <input
                type="text"
                value={formState.responsible}
                onChange={handleChange('responsible')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Nuevo responsable"
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
              Monto
              <input
                type="number"
                step="0.01"
                value={formState.amountValue}
                onChange={handleChange('amountValue')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ej: 125000"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Moneda
              <input
                type="text"
                value={formState.amountCurrency}
                onChange={handleChange('amountCurrency')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:border-primary focus:outline-none"
                placeholder="ARS"
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
                <option value="">Mantener valores actuales</option>
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
                placeholder="Agregar comentario para todas las operaciones seleccionadas"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              {dirtyCount > 0
                ? `${dirtyCount} campo${dirtyCount === 1 ? '' : 's'} se actualizarán en todas las operaciones seleccionadas.`
                : 'Definí qué campos querés sincronizar en las operaciones seleccionadas.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Aplicar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditLogisticsOperationsModal;
