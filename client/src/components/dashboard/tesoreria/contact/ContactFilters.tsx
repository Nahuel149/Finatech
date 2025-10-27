import React from 'react';
import { TreasuryContactBalanceFilterOptions } from '../../../../types';

export interface ContactFilterValues {
  operationType: string;
  status: string;
  currency: string;
  dateFrom: string | null;
  dateTo: string | null;
  search: string;
}

interface ActiveFilterChip {
  key: keyof ContactFilterValues;
  label: string;
}

interface Props {
  values: ContactFilterValues;
  options: TreasuryContactBalanceFilterOptions;
  activeFilters: ActiveFilterChip[];
  showAdvanced: boolean;
  onChange: (updates: Partial<ContactFilterValues>) => void;
  onRemoveFilter: (key: keyof ContactFilterValues) => void;
  onClearFilters: () => void;
  onToggleAdvanced: () => void;
  onApplyAdvanced: () => void;
  onCreateContact?: () => void;
}

const STATUS_LABEL_MAP: Record<string, string> = {
  registered: 'Registrada',
  settled: 'Compensada',
  pending: 'Pendiente',
};

export const ContactFilters: React.FC<Props> = ({
  values,
  options,
  activeFilters,
  showAdvanced,
  onChange,
  onRemoveFilter,
  onClearFilters,
  onToggleAdvanced,
  onApplyAdvanced,
  onCreateContact,
}) => {
  const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) => {
    onChange({ [key]: value || null });
  };

  return (
    <section
      id="filters-section"
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Filtros de operaciones</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary hover:text-blue-700 text-sm font-medium"
          >
            <i className="fa-solid fa-times mr-1" />
            Limpiar filtros
          </button>
          {onCreateContact && (
            <button
              type="button"
              onClick={onCreateContact}
              className="inline-flex items-center rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <i className="fa-solid fa-user-plus mr-2" />
              Nuevo contacto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de operación
          </label>
          <select
            value={values.operationType}
            onChange={(event) =>
              onChange({ operationType: event.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos los tipos</option>
            {options.operationTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={values.status}
            onChange={(event) =>
              onChange({ status: event.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos los estados</option>
            {options.statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {STATUS_LABEL_MAP[option.value] || option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
          <select
            value={values.currency}
            onChange={(event) =>
              onChange({ currency: event.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todas las monedas</option>
            {options.currencies.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha desde</label>
          <input
            type="date"
            value={values.dateFrom ?? ''}
            onChange={(event) => handleDateChange('dateFrom', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha hasta</label>
          <input
            type="date"
            value={values.dateTo ?? ''}
            onChange={(event) => handleDateChange('dateTo', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400" />
            </div>
            <input
              type="text"
              value={values.search}
              onChange={(event) => onChange({ search: event.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Buscar por código o referencia"
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
          Atajo: Ctrl/Cmd + F para enfocar la búsqueda.
        </span>
      </div>

      {showAdvanced && (
        <div className="mt-4 border-t border-gray-200 pt-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            Ajustá los filtros para refinar el historial de operaciones del contacto.
          </p>
          <div className="flex justify-end">
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
};
