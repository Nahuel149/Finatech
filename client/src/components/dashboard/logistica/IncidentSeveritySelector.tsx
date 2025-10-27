import React from 'react';
import type { IncidentSeverity, IncidentSeverityValue } from './incidentFormTypes';

interface IncidentSeveritySelectorProps {
  value: IncidentSeverityValue;
  onChange: (severity: IncidentSeverity) => void;
}

export const IncidentSeveritySelector: React.FC<IncidentSeveritySelectorProps> = ({
  value,
  onChange
}) => {
  const severityOptions = [
    { 
      value: 'low' as const, 
      label: 'Baja', 
      color: 'bg-green-100 text-green-800 border-green-200',
      selectedColor: 'bg-green-500 text-white border-green-500'
    },
    { 
      value: 'medium' as const, 
      label: 'Media', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      selectedColor: 'bg-yellow-500 text-white border-yellow-500'
    },
    { 
      value: 'high' as const, 
      label: 'Alta', 
      color: 'bg-red-100 text-red-800 border-red-200',
      selectedColor: 'bg-red-500 text-white border-red-500'
    }
  ];

  return (
    <div className="flex space-x-3">
      {severityOptions.map((option) => (
        <label 
          key={option.value}
          className="cursor-pointer"
        >
          <input 
            type="radio"
            name="severity"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <div 
            className={`
              px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200
              ${value === option.value ? option.selectedColor : option.color}
              hover:scale-105 hover:shadow-md
            `}
          >
            {option.label}
          </div>
        </label>
      ))}
    </div>
  );
};
