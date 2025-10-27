import React from 'react';

type MovementTypeValue = 'incoming' | 'outgoing' | '';

interface MovementTypeSelectorProps {
  value: MovementTypeValue;
  onChange: (value: MovementTypeValue) => void;
  error?: string | null;
}

const options = [
  {
    value: 'incoming' as MovementTypeValue,
    label: 'Ingreso',
    description: 'Entrada de fondos',
    icon: 'fa-arrow-trend-up',
    iconColor: 'text-success',
    badgeClass: 'bg-green-100',
  },
  {
    value: 'outgoing' as MovementTypeValue,
    label: 'Egreso',
    description: 'Salida de fondos',
    icon: 'fa-arrow-trend-down',
    iconColor: 'text-danger',
    badgeClass: 'bg-red-100',
  },
];

export const MovementTypeSelector: React.FC<MovementTypeSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de movimiento *</label>
      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`radio-card border-2 rounded-lg p-4 text-left focus:outline-none ${
                isSelected ? 'selected border-primary' : 'border-gray-200'
              }`}
              onClick={() => onChange(option.value)}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 ${option.badgeClass} rounded-lg flex items-center justify-center mr-3`}>
                  <i className={`fa-solid ${option.icon} ${option.iconColor}`} />
                </div>
                <div>
                  <div className="font-medium text-text-primary">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Seleccioná el tipo de flujo de fondos que querés registrar
      </p>
      {error && <div className="text-sm text-red-600 mt-1">{error}</div>}
    </div>
  );
};
