import React from 'react';

interface Props {
  methods: string[];
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  totalLabel: string;
  disabled?: boolean;
}

export const SimpleSettlementForm: React.FC<Props> = ({
  methods,
  selectedMethod,
  onMethodChange,
  totalLabel,
  disabled = false,
}) => (
  <div id="simple-form" className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">Método de liquidación</label>
      <select
        value={selectedMethod}
        onChange={(event) => onMethodChange(event.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
      >
        {methods.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">Monto</label>
      <input
        type="text"
        value={totalLabel}
        readOnly
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
      />
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center">
        <i className="fa-solid fa-info-circle text-blue-600 mr-2" />
        <span className="text-sm text-blue-800">Este método aplicará al 100% de la operación</span>
      </div>
    </div>
  </div>
);
