import React from 'react';

interface Props {
  enterAmount: number;
  onEnterAmountChange: (value: number) => void;
  exitAmount: number;
  enterLabel: string;
  exitLabel: string;
  disabled?: boolean;
}

const numberToInputValue = (value: number) => (Number.isNaN(value) ? '' : value);

export const AmountSection: React.FC<Props> = ({
  enterAmount,
  onEnterAmountChange,
  exitAmount,
  enterLabel,
  exitLabel,
  disabled = false,
}) => {
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing, especially useful when the field contains 0
    event.target.select();
  };

  return (
    <div id="amount-input" className="mb-6">
      <label className="block text-sm font-medium text-text-primary mb-2">Monto</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{enterLabel}</label>
          <input
            type="text"
            inputMode="decimal"
            value={numberToInputValue(enterAmount)}
            onChange={(event) => {
              const next = event.target.value.replace(',', '.');
              const parsed = parseFloat(next);
              onEnterAmountChange(Number.isFinite(parsed) ? parseFloat(parsed.toFixed(2)) : NaN);
            }}
            onFocus={handleFocus}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={disabled}
            placeholder="0"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{exitLabel}</label>
          <input
            type="text"
            inputMode="decimal"
            value={numberToInputValue(exitAmount)}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none cursor-not-allowed"
            placeholder="0"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
