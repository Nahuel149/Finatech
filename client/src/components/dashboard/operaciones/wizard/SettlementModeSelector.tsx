import React from 'react';

export type SettlementMode = 'simple' | 'compound';

interface Props {
  mode: SettlementMode;
  onChange: (mode: SettlementMode) => void;
  disabled?: boolean;
}

export const SettlementModeSelector: React.FC<Props> = ({ mode, onChange, disabled = false }) => (
  <div id="settlement-type" className="mb-8">
    <label className="block text-lg font-semibold text-text-primary mb-4">Tipo de liquidación</label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('simple')}
        disabled={disabled}
        className={`p-6 border-2 rounded-lg text-left transition-colors ${
          mode === 'simple'
            ? 'border-primary bg-primary bg-opacity-5 text-primary'
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center mb-2">
          <i className={`mr-3 text-lg ${mode === 'simple' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'}`} />
          <span className="font-semibold text-lg">Simple</span>
        </div>
        <div className="text-sm opacity-80">Un solo método de pago para el 100% de la operación</div>
      </button>
      <button
        type="button"
        onClick={() => onChange('compound')}
        disabled={disabled}
        className={`p-6 border-2 rounded-lg text-left transition-colors ${
          mode === 'compound'
            ? 'border-primary bg-primary bg-opacity-5 text-primary'
            : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center mb-2">
          <i className={`mr-3 text-lg ${mode === 'compound' ? 'fa-solid fa-circle-dot' : 'fa-regular fa-circle'}`} />
          <span className="font-semibold text-lg">Transferencias en pesos</span>
        </div>
        <div className="text-sm opacity-80">Múltiples métodos de pago combinados</div>
      </button>
    </div>
  </div>
);
