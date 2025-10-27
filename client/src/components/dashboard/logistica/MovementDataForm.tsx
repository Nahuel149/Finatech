import React, { useState } from 'react';
import { ChevronDownIcon } from '../../icons/HeroiconsOutline';

const MovementDataForm: React.FC = () => {
  const [movementType, setMovementType] = useState('');
  const [initialState, setInitialState] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [internalResponsible, setInternalResponsible] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [reference, setReference] = useState('');

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Datos del movimiento</h3>
      
      <div className="space-y-6">
        {/* Movement Type - Radio Pills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de movimiento <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'entrega', label: 'Entrega' },
              { value: 'transferencia-interna', label: 'Transferencia interna' },
              { value: 'retiro', label: 'Retiro' },
              { value: 'custodia', label: 'Custodia' }
            ].map((option) => (
              <label key={option.value} className="radio-pill-container">
                <input
                  type="radio"
                  name="movementType"
                  value={option.value}
                  checked={movementType === option.value}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="radio-pill-input"
                />
                <span className="radio-pill-label">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Initial State Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado inicial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={initialState}
              onChange={(e) => setInitialState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Seleccionar estado inicial</option>
              <option value="pendiente">Pendiente</option>
              <option value="en-proceso">En proceso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Origin and Destination - Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origen <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="">Seleccionar origen</option>
                <option value="oficina-central">Oficina Central</option>
                <option value="sucursal-norte">Sucursal Norte</option>
                <option value="sucursal-sur">Sucursal Sur</option>
                <option value="deposito-principal">Depósito Principal</option>
                <option value="externo">Externo</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destino <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
              >
                <option value="">Seleccionar destino</option>
                <option value="oficina-central">Oficina Central</option>
                <option value="sucursal-norte">Sucursal Norte</option>
                <option value="sucursal-sur">Sucursal Sur</option>
                <option value="deposito-principal">Depósito Principal</option>
                <option value="externo">Externo</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Internal Responsible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsable interno <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={internalResponsible}
              onChange={(e) => setInternalResponsible(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              <option value="">Seleccionar responsable</option>
              <option value="juan-perez">Juan Pérez</option>
              <option value="maria-gonzalez">María González</option>
              <option value="carlos-rodriguez">Carlos Rodríguez</option>
              <option value="ana-martinez">Ana Martínez</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Reference / Observations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referencia / Observaciones
          </label>
          <textarea
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Ingresá detalles adicionales sobre el movimiento..."
          />
        </div>
      </div>
    </div>
  );
};

export default MovementDataForm;