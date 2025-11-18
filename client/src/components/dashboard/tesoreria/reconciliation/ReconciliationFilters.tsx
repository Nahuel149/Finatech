import React from 'react';

export interface ReconciliationFiltersState {
  operationType: string;
  currency: string;
  contact: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: ReconciliationFiltersState;
  onUpdate: (next: Partial<ReconciliationFiltersState>) => void;
  onClear: () => void;
}

export const ReconciliationFilters: React.FC<Props> = ({ filters, onUpdate, onClear }) => (
  <div id="filters-section" className="bg-gray-50 border-b border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-text-primary mb-4">
      Filtro y búsqueda de coincidencias
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Tipo de operación</div>
        <select
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          value={filters.operationType}
          onChange={(event) => onUpdate({ operationType: event.target.value })}
        >
          <option value="">Todos</option>
          <option value="buy">Compra</option>
          <option value="sell">Venta</option>
          <option value="transfer">Transferencia ARS</option>
        </select>
      </div>

      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Moneda</div>
        <select
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          value={filters.currency}
          onChange={(event) => onUpdate({ currency: event.target.value })}
        >
          <option value="">Todas</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="filter-card border-2 border-gray-200 rounded-lg p-3">
        <div className="text-sm font-medium text-text-primary">Contacto</div>
        <input
          type="text"
          className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
          placeholder="Buscar contacto..."
          value={filters.contact}
          onChange={(event) => onUpdate({ contact: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 filter-card border-2 border-gray-200 rounded-lg p-3">
        <div>
          <div className="text-xs text-gray-500">Desde</div>
          <input
            type="date"
            className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
            value={filters.dateFrom}
            onChange={(event) => onUpdate({ dateFrom: event.target.value })}
          />
        </div>
        <div>
          <div className="text-xs text-gray-500">Hasta</div>
          <input
            type="date"
            className="w-full mt-1 text-sm border-none bg-transparent focus:outline-none"
            value={filters.dateTo}
            onChange={(event) => onUpdate({ dateTo: event.target.value })}
          />
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-500">
        Ajustá los filtros para mejorar las coincidencias sugeridas.
      </div>
      <button
        type="button"
        className="text-sm text-primary hover:text-blue-700 font-medium self-start sm:self-auto"
        onClick={onClear}
      >
        Limpiar filtros
      </button>
    </div>
  </div>
);
