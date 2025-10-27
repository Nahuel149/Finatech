import React from 'react';

interface Props {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export const SubtypeSelector: React.FC<Props> = ({ value, options, onChange }) => (
  <div id="subtype-selection" className="mb-6">
    <label className="block text-sm font-medium text-text-primary mb-2">Subtipo</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
