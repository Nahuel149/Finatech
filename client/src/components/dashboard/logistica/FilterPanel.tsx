import React, { useEffect, useMemo, useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '../../icons/HeroiconsOutline';
import { DEFAULT_LOGISTICS_FILTERS, LogisticsFilters, LogisticsOperation } from '../../../types/logistics';

interface FilterPanelProps {
  isOpen: boolean;
  filters: LogisticsFilters;
  onClose: () => void;
  onApplyFilters?: (filters: LogisticsFilters) => void;
  onClearFilters?: () => void;
  contactOptions?: string[];
  responsibleOptions?: string[];
  operations?: LogisticsOperation[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  filters,
  onClose,
  onApplyFilters,
  onClearFilters,
  contactOptions = [],
  responsibleOptions = [],
  operations = [],
}) => {
  const [localFilters, setLocalFilters] = useState<LogisticsFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [filters, isOpen]);

  const handleInputChange = (field: keyof LogisticsFilters, value: string | boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(localFilters);
    }
  };

  const handleClear = () => {
    setLocalFilters(DEFAULT_LOGISTICS_FILTERS);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const prefilteredOperations = useMemo(() => {
    if (!operations.length) {
      return [];
    }

    const dateFrom = localFilters.dateFrom ? new Date(localFilters.dateFrom) : null;
    const dateTo = localFilters.dateTo ? new Date(localFilters.dateTo) : null;
    if (dateTo) {
      dateTo.setHours(23, 59, 59, 999);
    }

    const searchTerm = localFilters.search?.trim().toLowerCase();

    const matchesSearch = (operation: LogisticsOperation) => {
      if (!searchTerm) {
        return true;
      }
      const haystack = [
        operation.operationCode,
        operation.contact,
        operation.responsible,
        operation.route,
        operation.origin,
        operation.destination,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return haystack.some((value) => value.includes(searchTerm));
    };

    return operations.filter((operation) => {
      if (localFilters.operationType && operation.type !== localFilters.operationType) {
        return false;
      }
      if (localFilters.status && operation.status !== localFilters.status) {
        return false;
      }
      if (!matchesSearch(operation)) {
        return false;
      }

      if (dateFrom || dateTo) {
        const operationDate = operation.date ? new Date(operation.date) : null;
        if (!operationDate || Number.isNaN(operationDate.getTime())) {
          return false;
        }
        if (dateFrom && operationDate < dateFrom) {
          return false;
        }
        if (dateTo && operationDate > dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [operations, localFilters]);

  const derivedContactOptions = useMemo(() => {
    if (!prefilteredOperations.length) {
      return [];
    }
    const unique = new Set<string>();
    prefilteredOperations.forEach((operation) => {
      if (operation.contact) {
        unique.add(operation.contact);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [prefilteredOperations]);

  const derivedResponsibleOptions = useMemo(() => {
    if (!prefilteredOperations.length) {
      return [];
    }
    const unique = new Set<string>();
    prefilteredOperations.forEach((operation) => {
      if (operation.responsible && operation.responsible !== 'Sin asignar') {
        unique.add(operation.responsible);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [prefilteredOperations]);

  const contactOptionsToShow = derivedContactOptions.length ? derivedContactOptions : contactOptions;
  const responsibleOptionsToShow = derivedResponsibleOptions.length ? derivedResponsibleOptions : responsibleOptions;

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-40" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-[400px] bg-white shadow-xl border-r border-gray-200">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Filtros avanzados</h3>
              <p className="text-sm text-gray-600">Configurá los criterios de búsqueda</p>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Búsqueda rápida</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(event) => handleInputChange('search', event.target.value)}
                    placeholder="ID, contacto, usuario..."
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Tipo de operación</label>
                <select
                  value={localFilters.operationType}
                  onChange={(event) => handleInputChange('operationType', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los tipos</option>
                  <option value="entrega">Entrega</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="retiro">Retiro</option>
                  <option value="custodia">Custodia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Estado</label>
                <select
                  value={localFilters.status}
                  onChange={(event) => handleInputChange('status', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en-curso">En curso</option>
                  <option value="completado">Completado</option>
                  <option value="anulado">Anulado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Rango de fechas</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={localFilters.dateFrom}
                      onChange={(event) => handleInputChange('dateFrom', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={localFilters.dateTo}
                      onChange={(event) => handleInputChange('dateTo', event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Contacto</label>
                <select
                  value={localFilters.contact}
                  onChange={(event) => handleInputChange('contact', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los contactos</option>
                  {contactOptionsToShow.map((contact) => (
                    <option key={contact} value={contact}>
                      {contact}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Responsable</label>
                <select
                  value={localFilters.responsible}
                  onChange={(event) => handleInputChange('responsible', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos los responsables</option>
                  {responsibleOptionsToShow.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  id="logistics-show-archived"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={localFilters.showArchived}
                  onChange={(event) => handleInputChange('showArchived', event.target.checked)}
                />
                <label htmlFor="logistics-show-archived" className="text-sm text-text-primary">
                  <span className="font-medium block">Mostrar operaciones archivadas</span>
                  <span className="text-xs text-gray-500">
                    Activá esta opción para revisar movimientos archivados y restaurarlos si es necesario.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApply();
                  onClose();
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterPanel;
