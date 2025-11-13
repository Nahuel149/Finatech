import React, { useMemo } from 'react';
import { PendingReceptionFilters } from '../../../../hooks';

interface Props {
  values: PendingReceptionFilters;
  onChange: <K extends keyof PendingReceptionFilters>(
    field: K,
    value: PendingReceptionFilters[K]
  ) => void;
  onApply: () => void;
  onClear: () => void;
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'omitted':
      return 'Omitida';
    case 'reverted':
      return 'Revertida';
    default:
      return status;
  }
};

export const PendingReceptionsFilters: React.FC<Props> = ({ values, onChange, onApply, onClear }) => {
  const chips = useMemo(() => {
    const active: Array<{ label: string; value: string }> = [];
    if (values.status) active.push({ label: 'Estado', value: statusLabel(values.status) });
    if (values.dateFrom) active.push({ label: 'Desde', value: values.dateFrom });
    if (values.dateTo) active.push({ label: 'Hasta', value: values.dateTo });
    if (values.courier) active.push({ label: 'Courier', value: values.courier });
    if (values.contact) active.push({ label: 'Contacto', value: values.contact });
    if (values.operation) active.push({ label: 'Operación', value: values.operation });
    if (values.currency) active.push({ label: 'Moneda', value: values.currency });
    if (values.amountMin) active.push({ label: 'Monto mínimo', value: values.amountMin });
    if (values.amountMax) active.push({ label: 'Monto máximo', value: values.amountMax });
    if (values.search) active.push({ label: 'Búsqueda', value: values.search });
    return active;
  }, [values]);

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8" aria-label="Filtros">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
            Estado Tesorería
          </label>
          <select
            id="filter-status"
            value={values.status}
            onChange={(event) => onChange('status', event.target.value as PendingReceptionFilters['status'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="omitted">Omitida</option>
            <option value="reverted">Revertida</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-date-from" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha desde
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={values.dateFrom}
            onChange={(event) => onChange('dateFrom', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-date-to" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha hasta
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={values.dateTo}
            onChange={(event) => onChange('dateTo', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-courier" className="block text-sm font-medium text-gray-700 mb-2">
            Courier / mensajero
          </label>
          <input
            id="filter-courier"
            type="text"
            value={values.courier}
            onChange={(event) => onChange('courier', event.target.value)}
            placeholder="ID o nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-contact" className="block text-sm font-medium text-gray-700 mb-2">
            Contacto origen/destino
          </label>
          <input
            id="filter-contact"
            type="text"
            value={values.contact}
            onChange={(event) => onChange('contact', event.target.value)}
            placeholder="ID o nombre"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-operation" className="block text-sm font-medium text-gray-700 mb-2">
            Operación / OL
          </label>
          <input
            id="filter-operation"
            type="text"
            value={values.operation}
            onChange={(event) => onChange('operation', event.target.value)}
            placeholder="ID de operación u OL"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-currency" className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            id="filter-currency"
            value={values.currency}
            onChange={(event) => onChange('currency', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todas</option>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filter-amount-min" className="block text-sm font-medium text-gray-700 mb-2">
              Monto mínimo
            </label>
            <input
              id="filter-amount-min"
              type="number"
              min="0"
              inputMode="decimal"
              value={values.amountMin}
              onChange={(event) => onChange('amountMin', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label htmlFor="filter-amount-max" className="block text-sm font-medium text-gray-700 mb-2">
              Monto máximo
            </label>
            <input
              id="filter-amount-max"
              type="number"
              min="0"
              inputMode="decimal"
              value={values.amountMax}
              onChange={(event) => onChange('amountMax', event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-2 xl:col-span-4">
          <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar por OL o contacto
          </label>
          <input
            id="filter-search"
            type="text"
            value={values.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Ej: OL-1234 o 'Cash San Isidro'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {chips.map((chip) => (
            <span
              key={`${chip.label}-${chip.value}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              <span className="font-medium mr-2">{chip.label}:</span>
              {chip.value}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Limpiar filtros
        </button>
        <button
          type="button"
          onClick={onApply}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
        >
          Aplicar filtros
        </button>
      </div>
    </section>
  );
};
