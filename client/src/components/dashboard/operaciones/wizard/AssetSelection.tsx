import React from 'react';

export interface AssetOption {
  code: string;
  label: string;
}

interface Props {
  enterValue: string;
  exitValue: string;
  enterOptions: AssetOption[];
  exitOptions: AssetOption[];
  onEnterChange: (value: string) => void;
  onExitChange: (value: string) => void;
  enterLabel?: string;
  exitLabel?: string;
  disabled?: boolean;
}

export const AssetSelection: React.FC<Props> = ({
  enterValue,
  exitValue,
  enterOptions,
  exitOptions,
  onEnterChange,
  onExitChange,
  enterLabel = 'Cliente recibe',
  exitLabel = 'Cliente paga',
  disabled = false,
}) => (
  <div id="asset-selection" className="mb-0">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">{enterLabel}</label>
        <select
          value={enterValue}
          onChange={(event) => onEnterChange(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          disabled={disabled}
        >
          {enterOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">{exitLabel}</label>
        <select
          value={exitValue}
          onChange={(event) => onExitChange(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          disabled={disabled}
        >
          {exitOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);
