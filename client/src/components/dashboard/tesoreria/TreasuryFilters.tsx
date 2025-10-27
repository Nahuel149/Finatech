import React, { useMemo } from 'react';
import { ApiError, ClientSummary } from '../../../types';
import { Alert } from '../../ui';
import { TreasuryMovementsFilters } from '../../../hooks';

interface Props {
  values: TreasuryMovementsFilters;
  onChange: <K extends keyof TreasuryMovementsFilters>(field: K, value: TreasuryMovementsFilters[K]) => void;
  onApply: () => void;
  onClear: () => void;
  contacts: ClientSummary[];
  contactsLoading: boolean;
  contactsError: ApiError | null;
  onRetryContacts: () => void;
}

const labelForType = (value: string) => {
  switch (value) {
    case 'incoming':
      return 'Ingreso';
    case 'outgoing':
      return 'Egreso';
    default:
      return value;
  }
};

const labelForMedium = (value: string) => {
  switch (value) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'deposit':
      return 'Depósito';
    default:
      return value;
  }
};

const labelForStatus = (value: string) => {
  switch (value) {
    case 'registered':
      return 'Registrado';
    case 'compensated':
      return 'Compensado';
    case 'cancelled':
      return 'Anulado';
    default:
      return value;
  }
};

const FILTER_LABELS: Record<keyof TreasuryMovementsFilters, string> = {
  dateFrom: 'Desde',
  dateTo: 'Hasta',
  type: 'Tipo',
  medium: 'Medio',
  currency: 'Moneda',
  status: 'Estado',
  contactId: 'Contacto',
  search: 'Buscar',
};

export const TreasuryFilters: React.FC<Props> = ({
  values,
  onChange,
  onApply,
  onClear,
  contacts,
  contactsLoading,
  contactsError,
  onRetryContacts,
}) => {
  const chips = useMemo(() => {
    const entries: Array<{ field: keyof TreasuryMovementsFilters; label: string; value: string }> = [];

    (Object.keys(values) as Array<keyof TreasuryMovementsFilters>).forEach((field) => {
      const fieldValue = values[field];
      if (!fieldValue) {
        return;
      }
      let readable = fieldValue;
      if (field === 'type') readable = labelForType(fieldValue);
      if (field === 'medium') readable = labelForMedium(fieldValue);
      if (field === 'status') readable = labelForStatus(fieldValue);
      if (field === 'contactId') {
        const contact = contacts.find((c) => c.id === fieldValue);
        readable = contact?.fullName || contact?.shortName || 'Contacto';
      }
      if (field === 'search') {
        readable = `"${fieldValue}"`;
      }
      entries.push({
        field,
        label: FILTER_LABELS[field],
        value: readable,
      });
    });

    return entries;
  }, [contacts, values]);

  return (
    <section
      id="filters-section"
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-4">
        <div>
          <label htmlFor="filter-date-from" className="block text-sm font-medium text-gray-700 mb-2">
            Desde
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
            Hasta
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
          <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <select
            id="filter-type"
            value={values.type}
            onChange={(event) => onChange('type', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            <option value="incoming">Ingreso</option>
            <option value="outgoing">Egreso</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-medium" className="block text-sm font-medium text-gray-700 mb-2">
            Medio
          </label>
          <select
            id="filter-medium"
            value={values.medium}
            onChange={(event) => onChange('medium', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="deposit">Depósito</option>
          </select>
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
          </select>
        </div>

        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="filter-status"
            value={values.status}
            onChange={(event) => onChange('status', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            <option value="registered">Registrado</option>
            <option value="compensated">Compensado</option>
            <option value="cancelled">Anulado</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-contact" className="block text-sm font-medium text-gray-700 mb-2">
            Contacto
          </label>
          <select
            id="filter-contact"
            value={values.contactId}
            onChange={(event) => onChange('contactId', event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Todos</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName}
              </option>
            ))}
          </select>
          {contactsLoading && (
            <p className="text-xs text-gray-500 mt-1">Cargando contactos…</p>
          )}
          {contactsError && (
            <Alert
              type="error"
              message={contactsError.message}
              className="mt-2"
              onClose={onRetryContacts}
            />
          )}
        </div>

        <div>
          <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400" />
            </div>
            <input
              id="filter-search"
              type="text"
              value={values.search}
              onChange={(event) => onChange('search', event.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="ID o referencia…"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div id="active-filters" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={`${chip.field}-${chip.value}`}
              className="chip-removable inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-white"
            >
              {chip.label}: {chip.value}
              <button
                type="button"
                className="ml-2 text-white hover:text-gray-200"
                onClick={() => onChange(chip.field, '')}
                aria-label={`Quitar filtro ${chip.label}`}
              >
                <i className="fa-solid fa-times text-xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-3 justify-end">
          <button
            type="button"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            <i className="fa-solid fa-times mr-1" />
            Limpiar filtros
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <i className="fa-solid fa-filter mr-2" />
            Aplicar filtros
          </button>
        </div>
      </div>
    </section>
  );
};
