import React, { useMemo } from 'react';
import { ChevronDownIcon } from '../../icons/HeroiconsOutline';

export type MovementTypeValue = 'entrega' | 'transferencia' | 'retiro' | 'custodia';

export type MovementInitialStateValue = 'pendiente' | 'en-curso' | 'completado' | 'anulado';

export interface LogisticsMovementDraft {
  type: MovementTypeValue | string;
  state: MovementInitialStateValue | string;
  origin: string;
  destination: string;
  responsible: string;
  datetime: string;
  reference: string;
}

const MOVEMENT_OPTIONS: Array<{
  value: MovementTypeValue;
  label: string;
  icon: string;
}> = [
  { value: 'entrega', label: 'Entrega', icon: 'fa-truck' },
  { value: 'transferencia', label: 'Transferencia interna', icon: 'fa-arrow-right-arrow-left' },
  { value: 'retiro', label: 'Retiro', icon: 'fa-arrow-up' },
  { value: 'custodia', label: 'Custodia', icon: 'fa-shield-halved' },
];

const RESPONSIBLE_OPTIONS = [
  { value: 'Juan Pérez', label: 'Juan Pérez' },
  { value: 'Ana López', label: 'Ana López' },
  { value: 'Luis García', label: 'Luis García' },
  { value: 'María Torres', label: 'María Torres' },
  { value: 'Carlos Mendoza', label: 'Carlos Mendoza' },
];

const LOCATION_OPTIONS = [
  { value: 'Sede Central', label: 'Sede Central' },
  { value: 'Sucursal Norte', label: 'Sucursal Norte' },
  { value: 'Sucursal Sur', label: 'Sucursal Sur' },
  { value: 'Bóveda A', label: 'Bóveda A' },
  { value: 'Bóveda B', label: 'Bóveda B' },
  { value: 'Bóveda Principal', label: 'Bóveda Principal' },
  { value: 'Oficina Principal', label: 'Oficina Principal' },
];

interface MovementDataFormProps {
  value: LogisticsMovementDraft;
  onChange: React.Dispatch<React.SetStateAction<LogisticsMovementDraft>>;
}

const MovementDataForm: React.FC<MovementDataFormProps> = ({ value, onChange }) => {
  const movementType = (value.type as MovementTypeValue) || 'entrega';
  const initialState = (value.state as MovementInitialStateValue) || 'pendiente';
  const origin = value.origin || '';
  const destination = value.destination || '';
  const internalResponsible = value.responsible || '';
  const dateTime = value.datetime || '';
  const reference = value.reference || '';

  const movementHint = useMemo(() => {
    if (movementType === 'transferencia') {
      return 'Usá origen y destino de sedes o bóvedas internas.';
    }
    if (movementType === 'custodia') {
      return 'Indicá la bóveda o caja de resguardo correspondiente.';
    }
    return null;
  }, [movementType]);

  const referenceCharacterLimit = 200;

  return (
    <section>
      <h3 className="text-lg font-semibold text-text-primary mb-6">Datos del movimiento</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Tipo de movimiento <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {MOVEMENT_OPTIONS.map((option) => {
              const isActive = movementType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange((prev) => ({ ...prev, type: option.value }));
                  }}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 text-center transition-all ${
                    isActive
                      ? 'border-primary bg-blue-50 text-primary shadow-sm'
                      : 'border-gray-200 text-text-primary hover:border-primary hover:bg-blue-50'
                  }`}
                >
                  <i
                    className={`fa-solid ${option.icon} text-2xl mb-2 ${
                      isActive ? 'text-primary' : 'text-gray-400'
                    }`}
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Elegí el tipo de acción operativa a registrar.</p>
          {movementHint && <p className="text-xs text-blue-600 mt-1">{movementHint}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Estado inicial <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={initialState}
              onChange={(e) => onChange((prev) => ({ ...prev, state: e.target.value as MovementInitialStateValue }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en-curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="anulado">Anulado</option>
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Origen <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={origin}
              onChange={(e) => onChange((prev) => ({ ...prev, origin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Seleccionar origen…</option>
              {LOCATION_OPTIONS.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Destino <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={destination}
              onChange={(e) => onChange((prev) => ({ ...prev, destination: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Seleccionar destino…</option>
              {LOCATION_OPTIONS.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Fecha y hora <span className="text-danger">*</span>
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => onChange((prev) => ({ ...prev, datetime: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Responsable interno <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <select
              value={internalResponsible}
              onChange={(e) => onChange((prev) => ({ ...prev, responsible: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Seleccionar responsable…</option>
              {RESPONSIBLE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Quién gestiona esta operación logística.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Referencia / Observaciones
          </label>
          <textarea
            value={reference}
            onChange={(e) => {
              const next = e.target.value.slice(0, referenceCharacterLimit);
              onChange((prev) => ({ ...prev, reference: next }));
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Ingresá detalles adicionales sobre el movimiento…"
          />
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Máximo {referenceCharacterLimit} caracteres</span>
            <span>
              {reference.length}/{referenceCharacterLimit}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovementDataForm;
