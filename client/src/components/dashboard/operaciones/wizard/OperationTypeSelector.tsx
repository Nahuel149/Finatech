import React from 'react';
import { TransactionType } from '../../../../types';

interface Props {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
}

const baseClasses =
  'p-4 border-2 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed';
const activeClasses = 'border-primary bg-primary bg-opacity-5 text-primary';
const inactiveClasses = 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary';

export const OperationTypeSelector: React.FC<Props> = ({ value, onChange, disabled = false }) => (
  <div id="operation-type" className="mb-6">
    <label className="block text-sm font-medium text-text-primary mb-2">Tipo de operación</label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('buy')}
        className={`${baseClasses} ${value === 'buy' ? activeClasses : inactiveClasses}`}
        disabled={disabled}
      >
        <i className="fa-solid fa-arrow-down mr-2" />
        Compra
      </button>
      <button
        type="button"
        onClick={() => onChange('sell')}
        className={`${baseClasses} ${value === 'sell' ? activeClasses : inactiveClasses}`}
        disabled={disabled}
      >
        <i className="fa-solid fa-arrow-up mr-2" />
        Venta
      </button>
    </div>
  </div>
);
