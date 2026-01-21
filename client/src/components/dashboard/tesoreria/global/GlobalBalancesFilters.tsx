import React from 'react';
import { TreasuryGlobalBalancesFilters, TreasuryBalanceState } from '../../../../types/treasury';

export interface FilterValues {
  currency: string;
  accountKey: string;
  search: string;
  contactType: string;
  balanceState: TreasuryBalanceState | '';
  dateFrom: string | null;
  dateTo: string | null;
}

interface ActiveFilterChip {
  key: keyof FilterValues;
  label: string;
}

interface Props {
  values: FilterValues;
  options: TreasuryGlobalBalancesFilters;
  activeFilters: ActiveFilterChip[];
  showAdvanced: boolean;
  onChange: (updates: Partial<FilterValues>) => void;
  onRemoveFilter: (key: keyof FilterValues) => void;
  onClearFilters: () => void;
  onToggleAdvanced: () => void;
  onApplyAdvanced: () => void;
}

export const GlobalBalancesFilters: React.FC<Props> = ({
  values,
  options,
  activeFilters,
  showAdvanced,
  onChange,
  onRemoveFilter,
  onClearFilters,
  onToggleAdvanced,
  onApplyAdvanced,
}) => (
  <section
    id="filters-section"
    className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
      <button
        type="button"
        onClick={onClearFilters}
        className="text-primary hover:text-blue-700 text-sm font-medium"
      >
        <i className="fa-solid fa-times mr-1" />
        Limpiar filtros
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
        <select
          value={values.currency}
          onChange={(event) =>
            onChange({
              currency: event.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="ALL">Todas las monedas</option>
          {options.currencies.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de cuenta
        </label>
        <select
          value={values.accountKey}
          onChange={(event) =>
            onChange({
              accountKey: event.target.value,
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Todos los tipos</option>
          {options.accountKeys.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-gray-400" />
          </div>
          <input
            type="text"
            value={values.search}
            onChange={(event) =>
              onChange({
                search: event.target.value,
              })
            }
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Buscar cliente o cuenta…"
          />
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-4" id="active-filters">
      {activeFilters.map((chip) => (
        <span
          key={chip.key}
          className="chip-removable inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-white"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemoveFilter(chip.key)}
            className="ml-2 text-white hover:text-gray-200"
          >
            <i className="fa-solid fa-times text-xs" />
          </button>
        </span>
      ))}
      {!activeFilters.length && (
        <span className="text-sm text-gray-500">Sin filtros activos.</span>
      )}
    </div>

    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <i className="fa-solid fa-filter mr-2" />
        Filtros avanzados
      </button>
      <span className="text-xs text-gray-500">
        Atajo: Ctrl/Cmd + F para buscar rápidamente.
      </span>
    </div>

    {showAdvanced && (
      <div className="mt-4 border-t border-gray-200 pt-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de contacto
            </label>
            <select
              value={values.contactType}
              onChange={(event) =>
                onChange({
                  contactType: event.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Todos</option>
              {options.contactTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={values.dateFrom ?? ''}
              onChange={(event) =>
                onChange({
                  dateFrom: event.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={values.dateTo ?? ''}
              onChange={(event) =>
                onChange({
                  dateTo: event.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado del saldo
            </label>
            <select
              value={values.balanceState}
              onChange={(event) =>
                onChange({
                  balanceState: event.target.value as TreasuryBalanceState | '',
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Todos</option>
              {options.balanceStates.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <button
            type="button"
            onClick={onApplyAdvanced}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    )}
  </section>
);
