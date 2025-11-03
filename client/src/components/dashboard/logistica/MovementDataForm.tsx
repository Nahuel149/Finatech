import React, { useMemo, useState } from 'react';
import { ChevronDownIcon } from '../../icons/HeroiconsOutline';

type MovementTypeValue = 'entrega' | 'transferencia' | 'retiro' | 'custodia';

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
  { value: 'juan-perez', label: 'Juan Pérez' },
  { value: 'ana-lopez', label: 'Ana López' },
  { value: 'luis-garcia', label: 'Luis García' },
  { value: 'maria-torres', label: 'María Torres' },
  { value: 'carlos-mendoza', label: 'Carlos Mendoza' },
];

const LOCATION_OPTIONS = [
  { value: 'sede-central', label: 'Sede Central' },
  { value: 'sucursal-norte', label: 'Sucursal Norte' },
  { value: 'sucursal-sur', label: 'Sucursal Sur' },
  { value: 'boveda-a', label: 'Bóveda A' },
  { value: 'boveda-b', label: 'Bóveda B' },
  { value: 'boveda-principal', label: 'Bóveda Principal' },
  { value: 'oficina-principal', label: 'Oficina Principal' },
];

const MovementDataForm: React.FC = () => {
  const [movementType, setMovementType] = useState<MovementTypeValue>('entrega');
  const [initialState, setInitialState] = useState('pendiente');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [internalResponsible, setInternalResponsible] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [reference, setReference] = useState('');

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
                  onClick={() => setMovementType(option.value)}
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
              onChange={(e) => setInitialState(e.target.value)}
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
              onChange={(e) => setOrigin(e.target.value)}
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
              onChange={(e) => setDestination(e.target.value)}
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
            onChange={(e) => setDateTime(e.target.value)}
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
              onChange={(e) => setInternalResponsible(e.target.value)}
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
            onChange={(e) => setReference(e.target.value.slice(0, referenceCharacterLimit))}
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
