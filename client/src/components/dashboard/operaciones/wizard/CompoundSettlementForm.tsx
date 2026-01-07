import React from 'react';

export interface CompoundLine {
  id: string;
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number | null;
}

export interface CompoundComputed {
  percentage: number;
  amount: number;
}

const normalizeNumericInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const cleaned = trimmed.replace(/[^\d.,]/g, '');
  const firstSeparatorMatch = cleaned.match(/[.,]/);
  if (!firstSeparatorMatch) {
    return cleaned;
  }

  const firstSeparatorIndex = cleaned.indexOf(firstSeparatorMatch[0]);
  const integerPart = cleaned.slice(0, firstSeparatorIndex).replace(/[.,]/g, '');
  const decimalsRaw = cleaned.slice(firstSeparatorIndex + 1).replace(/[.,]/g, '');
  const decimals = decimalsRaw.slice(0, 2);
  const hasTrailingSeparator = firstSeparatorIndex === cleaned.length - 1;

  if (hasTrailingSeparator) {
    return `${integerPart}${firstSeparatorMatch[0]}`;
  }

  if (decimals) {
    return `${integerPart}${firstSeparatorMatch[0]}${decimals}`;
  }

  return integerPart;
};

const parseNumericInput = (value: string) => {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

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
          <div className="col-span-4">Metodo</div>
          <div className="col-span-2">Tipo</div>
          <div className="col-span-4">Monto</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {lines.map((line) => {
          const info = computed[line.id] || { percentage: 0, amount: 0 };
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
                    <option value="">Seleccionar...</option>
                    {methods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={line.allocationType}
                    onChange={(event) =>
                      onLineChange(line.id, {
                        allocationType: event.target.value as 'amount' | 'percentage',
                      })
                    }
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  >
                    <option value="amount">Monto</option>
                    <option value="percentage">%</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={line.value === null ? '' : String(line.value)}
                    disabled={disabled}
                    onChange={(event) => {
                      const normalized = normalizeNumericInput(event.target.value);
                      onLineChange(line.id, {
                        value: normalized === '' ? null : parseNumericInput(normalized),
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm placeholder:text-gray-400"
                    placeholder={line.allocationType === 'percentage' ? 'Ej: 40' : 'Ej: 50000'}
                  />
                </div>

                <div className="md:col-span-1 text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{formatAmount(amountValue)}</span>
                  </div>
                </div>

                <div className="md:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.id)}
                    disabled={disabled}
                    className="text-gray-400 hover:text-danger transition-colors w-full md:w-auto"
                    aria-label="Eliminar linea"
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
            Agrega al menos un metodo para continuar.
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
          Agregar linea
        </button>
      </div>
    </div>

    <div className="text-xs text-gray-500">
      Base para los calculos: <span className="font-semibold text-text-primary">{baseCurrencyLabel}</span>
    </div>
  </div>
);
