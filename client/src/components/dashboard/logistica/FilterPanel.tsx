import React, { useState } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '../../icons/HeroiconsOutline';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
  onApplyFilters?: (filters: FilterState) => void;
  onClearFilters?: () => void;
}

interface FilterState {
  search: string;
  operationType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  contact: string;
  responsible: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onApply,
  onApplyFilters,
  onClearFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    operationType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    contact: '',
    responsible: ''
  });

  const operationTypes = [
    { value: '', label: 'Todos los tipos' },
    { value: 'entrega', label: 'Entrega' },
    { value: 'retiro', label: 'Retiro' },
    { value: 'transferencia-interna', label: 'Transferencia interna' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en-transito', label: 'En tránsito' },
    { value: 'completado', label: 'Completado' },
    { value: 'anulado', label: 'Anulado' }
  ];

  const responsibleOptions = [
    { value: '', label: 'Todos los responsables' },
    { value: 'ana-lopez', label: 'Ana López' },
    { value: 'carlos-ruiz', label: 'Carlos Ruiz' },
    { value: 'maria-garcia', label: 'María García' }
  ];

  const handleInputChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    if (onApply) {
      onApply(filters);
    }
  };

  const handleClear = () => {
    const clearedFilters: FilterState = {
      search: '',
      operationType: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      contact: '',
      responsible: ''
    };
    setFilters(clearedFilters);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-text-primary">
              Filtros avanzados
            </h3>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Quick Search */}
              <div>
                <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-2">
                  Búsqueda rápida
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="filter-search"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="ID, cliente, responsable..."
                    value={filters.search}
                    onChange={(e) => handleInputChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Operation Type */}
              <div>
                <label htmlFor="filter-operation-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de operación
                </label>
                <select
                  id="filter-operation-type"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  value={filters.operationType}
                  onChange={(e) => handleInputChange('operationType', e.target.value)}
                >
                  {operationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="filter-status"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  value={filters.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de fechas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="filter-date-from" className="block text-xs text-gray-500 mb-1">
                      Desde
                    </label>
                    <input
                      id="filter-date-from"
                      type="date"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                      value={filters.dateFrom}
                      onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-date-to" className="block text-xs text-gray-500 mb-1">
                      Hasta
                    </label>
                    <input
                      id="filter-date-to"
                      type="date"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                      value={filters.dateTo}
                      onChange={(e) => handleInputChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <label htmlFor="filter-contact" className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto
                </label>
                <input
                  id="filter-contact"
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nombre del cliente o proveedor"
                  value={filters.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                />
              </div>

              {/* Responsible */}
              <div>
                <label htmlFor="filter-responsible" className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable
                </label>
                <select
                  id="filter-responsible"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  value={filters.responsible}
                  onChange={(e) => handleInputChange('responsible', e.target.value)}
                >
                  {responsibleOptions.map((responsible) => (
                    <option key={responsible.value} value={responsible.value}>
                      {responsible.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleClear}
              >
                Limpiar filtros
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={handleApply}
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
