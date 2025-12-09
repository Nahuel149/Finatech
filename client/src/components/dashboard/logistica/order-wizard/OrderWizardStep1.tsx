import React, { useRef } from 'react';
import { LogisticsOrderOperationContext, LogisticsAddressOption } from '../../../../types';
import { LogisticsOrderFormState, FormFieldErrors, MessengerOption } from './types';

interface OrderWizardStep1Props {
  form: LogisticsOrderFormState;
  errors: FormFieldErrors;
  onChange: (field: keyof LogisticsOrderFormState, value: any) => void;
  operation: LogisticsOrderOperationContext | null;
  addressOptions?: LogisticsAddressOption[];
  addressSelection: string;
  onSelectAddress?: (selection: string) => void;
  messengerOptions?: MessengerOption[];
  onSelectMessenger?: (optionId: string | null) => void;
  messengersLoading?: boolean;
}

const dateInputHelp = (value: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const OrderWizardStep1: React.FC<OrderWizardStep1Props> = ({
  form,
  errors,
  onChange,
  operation,
  addressOptions = [],
  addressSelection,
  onSelectAddress = () => {},
  messengerOptions = [],
  onSelectMessenger = () => {},
  messengersLoading = false,
}) => {
  const addressSelectRef = useRef<HTMLSelectElement | null>(null);
  const manualValue = form.destination || form.origin;
  const showAddressError = errors.origin || errors.destination;

  return (
    <div className="space-y-6">
      {operation && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-xs uppercase text-blue-600 tracking-wide mb-1">Operación vinculada</p>
          <p className="text-sm font-semibold text-text-primary">{operation.code || operation.id}</p>
          <p className="text-sm text-gray-600">Cliente / contraparte: {operation.clientName || '—'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de orden *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.type}
            onChange={(event) => onChange('type', event.target.value as LogisticsOrderFormState['type'])}
          >
            <option value="RETIRO">Retiro</option>
            <option value="ENTREGA">Entrega</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Mensajero asignado (opcional)</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={
              form.messengerId ||
              (form.messenger
                ? messengerOptions.find((option) => option.type !== 'user' && option.name === form.messenger)?.id || ''
                : '')
            }
            onChange={(event) => onSelectMessenger(event.target.value || null)}
          >
            <option value="">Sin asignar</option>
            {messengerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.email ? ` • ${option.email}` : ''}
              </option>
            ))}
          </select>
          {messengersLoading && <p className="text-xs text-gray-500 mt-1">Cargando mensajeros...</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Dirección *</label>
        <select
          ref={addressSelectRef}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={addressSelection || form.destinationAddressId || form.originAddressId || 'custom'}
          onChange={(event) => onSelectAddress(event.target.value || 'custom')}
        >
          {addressOptions.length > 0 && <option value="">Elegir dirección guardada</option>}
          {addressOptions.map((address) => (
            <option key={address.id} value={address.id}>
              {address.label ? `${address.label} • ${address.formatted}` : address.formatted}
            </option>
          ))}
          <option value="branch">Sucursal del cliente</option>
          <option value="custom">Otros (ingresar manual)</option>
        </select>
        {addressOptions.length === 0 && (
          <p className="text-xs text-gray-500 mb-1">El cliente no tiene domicilios guardados.</p>
        )}

        <input
          type="text"
          className={`w-full border rounded-lg px-3 py-2 text-sm ${
            showAddressError ? 'border-red-300' : 'border-gray-300'
          } ${addressSelection === 'custom' ? '' : 'bg-gray-50 cursor-pointer'}`}
          placeholder="Sucursal, domicilio, tercero"
          value={manualValue}
          disabled={addressSelection !== 'custom'}
          onClick={() => {
            if (addressSelection !== 'custom') {
              onSelectAddress('custom');
              addressSelectRef.current?.focus();
            }
          }}
          onChange={(event) => {
            onChange('destination', event.target.value);
            onChange('origin', event.target.value);
            onChange('destinationAddressId', null);
            onChange('originAddressId', null);
          }}
        />
        <div className="flex items-center justify-between">
          {showAddressError && <p className="text-xs text-red-600">{errors.origin || errors.destination}</p>}
          {addressOptions.length > 0 && (
            <button
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => onSelectAddress(addressOptions[0]?.id || 'branch')}
            >
              Usar dirección del cliente
            </button>
          )}
        </div>
        {addressSelection !== 'custom' && (
          <p className="text-xs text-gray-500">
            Seleccioná “Otros (ingresar manual)” o hacé click en el campo para editar.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Ventana de inicio *</label>
          <input
            type="datetime-local"
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.windowStart ? 'border-red-300' : 'border-gray-300'}`}
            value={form.windowStart}
            onChange={(event) => onChange('windowStart', event.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">{dateInputHelp(form.windowStart)}</p>
          {errors.windowStart && <p className="text-xs text-red-600">{errors.windowStart}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Ventana de fin *</label>
          <input
            type="datetime-local"
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.windowEnd ? 'border-red-300' : 'border-gray-300'}`}
            value={form.windowEnd}
            onChange={(event) => onChange('windowEnd', event.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">{dateInputHelp(form.windowEnd)}</p>
          {errors.windowEnd && <p className="text-xs text-red-600">{errors.windowEnd}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Contacto *</label>
          <input
            type="text"
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.contactName ? 'border-red-300' : 'border-gray-300'}`}
            value={form.contactName}
            onChange={(event) => onChange('contactName', event.target.value)}
          />
          {errors.contactName && <p className="text-xs text-red-600">{errors.contactName}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono *</label>
          <input
            type="tel"
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.contactPhone ? 'border-red-300' : 'border-gray-300'}`}
            value={form.contactPhone}
            onChange={(event) => onChange('contactPhone', event.target.value)}
          />
          {errors.contactPhone && <p className="text-xs text-red-600">{errors.contactPhone}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(event) => onChange('notes', event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Notas internas</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={form.internalNotes}
            onChange={(event) => onChange('internalNotes', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
