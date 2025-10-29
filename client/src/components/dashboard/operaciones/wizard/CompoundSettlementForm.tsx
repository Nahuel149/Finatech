import React from 'react';

export interface CompoundLine {
  id: string;
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
}

export interface CompoundComputed {
  percentage: number;
  amount: number;
}

interface Props {
  lines: CompoundLine[];
  computed: Record<string, CompoundComputed>;
  methods: string[];
  onLineChange: (id: string, changes: Partial<CompoundLine>) => void;
  onRemoveLine: (id: string) => void;
  onAddLine: () => void;
  baseCurrencyLabel: string;
  disabled?: boolean;
  formatAmount: (amount: number) => string;
}

const allocationLabels: Record<CompoundLine['allocationType'], string> = {
  percentage: 'Porcentaje',
  amount: 'Monto',
};

export const CompoundSettlementForm: React.FC<Props> = ({
  lines,
  computed,
  methods,
  onLineChange,
  onRemoveLine,
  onAddLine,
  baseCurrencyLabel,
  disabled = false,
  formatAmount,
}) => (
  <div id="compound-form" className={`${lines.length === 0 ? 'space-y-6' : 'space-y-6'}`}>
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 hidden md:block">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500">
          <div className="col-span-4">Método</div>
          <div className="col-span-2">Asignación</div>
          <div className="col-span-3">Valor</div>
          <div className="col-span-2">Equivalente</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {lines.map((line) => {
          const info = computed[line.id] || { percentage: 0, amount: 0 };
          const percentageValue = Number.isFinite(info.percentage) ? info.percentage : 0;
          const amountValue = Number.isFinite(info.amount) ? info.amount : 0;

          return (
            <div key={line.id} className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <select
                    value={line.method}
                    onChange={(event) => onLineChange(line.id, { method: event.target.value })}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  >
                    <option value="">Seleccionar…</option>
                    {methods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {(['percentage'] as CompoundLine['allocationType'][]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={disabled}
                        onClick={() => onLineChange(line.id, { allocationType: type })}
                        className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                          line.allocationType === type
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {allocationLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step={line.allocationType === 'percentage' ? '0.1' : '0.01'}
                    value={Number.isFinite(line.value) ? line.value : ''}
                    disabled={disabled || line.allocationType === 'amount'}
                    readOnly={line.allocationType === 'amount'}
                    onChange={(event) =>
                      onLineChange(line.id, {
                        value: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                    placeholder={line.allocationType === 'percentage' ? 'Ej: 25' : 'Ej: 50000'}
                  />
                </div>

                <div className="md:col-span-2 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">
                      {formatAmount(amountValue)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {percentageValue.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="md:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.id)}
                    disabled={disabled}
                    className="text-gray-400 hover:text-danger transition-colors w-full md:w-auto"
                    aria-label="Eliminar línea"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {lines.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">
            <i className="fa-solid fa-circle-info mr-2" />
            Agregá al menos un método para continuar.
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200">
        <button
          type="button"
          onClick={onAddLine}
          disabled={disabled}
          className="flex items-center text-primary hover:text-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-plus mr-2" />
          Agregar línea
        </button>
      </div>
    </div>

    <div className="text-xs text-gray-500">
      Base para los cálculos: <span className="font-semibold text-text-primary">{baseCurrencyLabel}</span>
    </div>
  </div>
);
