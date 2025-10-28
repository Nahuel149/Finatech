import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '../../icons/HeroiconsOutline';

interface MovementData {
  id: string;
  date: string;
  type: 'Entrega' | 'Recogida' | 'Transferencia' | 'Devolución';
  origin: string;
  destination: string;
  client: string;
  driver: string;
  status: 'Completado' | 'En tránsito' | 'Pendiente' | 'Cancelado' | 'Con incidencia';
  value: number;
  estimatedTime: string;
  actualTime?: string;
  hasIncident: boolean;
  incidentId?: string;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  movementType: string;
  status: string;
  searchTerm: string;
}

interface LogisticsRecentMovementsSectionProps {
  movements: MovementData[];
  onMovementClick: (movementId: string) => void;
  onIncidentClick?: (incidentId: string) => void;
}

export const LogisticsRecentMovementsSection: React.FC<LogisticsRecentMovementsSectionProps> = ({
  movements,
  onMovementClick,
  onIncidentClick
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    movementType: '',
    status: '',
    searchTerm: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof MovementData>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort movements
  const filteredAndSortedMovements = useMemo(() => {
    let filtered = movements.filter(movement => {
      const matchesSearch = !filters.searchTerm || 
        movement.client.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        movement.driver.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        movement.origin.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        movement.destination.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        movement.id.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesType = !filters.movementType || movement.type === filters.movementType;
      const matchesStatus = !filters.status || movement.status === filters.status;
      
      const matchesDateFrom = !filters.dateFrom || new Date(movement.date) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(movement.date) <= new Date(filters.dateTo);

      return matchesSearch && matchesType && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string = '';
      let bValue: number | string = '';

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortField === 'value') {
        aValue = a.value;
        bValue = b.value;
      } else {
        aValue = String(a[sortField] ?? '').toLowerCase();
        bValue = String(b[sortField] ?? '').toLowerCase();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      return sortDirection === 'asc'
        ? (aValue as string).localeCompare(bValue as string, 'es')
        : (bValue as string).localeCompare(aValue as string, 'es');
    });

    return filtered;
  }, [movements, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredAndSortedMovements.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof MovementData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      movementType: '',
      status: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completado':
        return CheckCircleIcon;
      case 'En tránsito':
        return TruckIcon;
      case 'Pendiente':
        return ClockIcon;
      case 'Con incidencia':
        return ExclamationTriangleIcon;
      case 'Cancelado':
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'text-green-600 bg-green-50';
      case 'En tránsito':
        return 'text-blue-600 bg-blue-50';
      case 'Pendiente':
        return 'text-yellow-600 bg-yellow-50';
      case 'Con incidencia':
        return 'text-red-600 bg-red-50';
      case 'Cancelado':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Movimientos Recientes
        </h2>
        <p className="text-sm text-gray-600">
          Historial de movimientos logísticos registrados en el sistema.
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de movimiento
            </label>
            <select
              value={filters.movementType}
              onChange={(e) => handleFilterChange('movementType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="Entrega">Entrega</option>
              <option value="Recogida">Recogida</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Devolución">Devolución</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="Completado">Completado</option>
              <option value="En tránsito">En tránsito</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Con incidencia">Con incidencia</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cliente, conductor, ID..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900">
                {filteredAndSortedMovements.length} movimientos encontrados
              </span>
              {Object.values(filters).some(filter => filter !== '') && (
                <span className="text-xs text-gray-500">
                  (filtrado de {movements.length} total)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
              
              <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortField === 'date' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Tipo
                    {sortField === 'type' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen → Destino
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center">
                    Cliente
                    {sortField === 'client' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center">
                    Valor
                    {sortField === 'value' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMovements.map((movement) => {
                const StatusIcon = getStatusIcon(movement.status);
                
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="truncate max-w-20">{movement.origin}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="truncate max-w-20">{movement.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.driver}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {movement.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(movement.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="text-xs text-gray-500">Est: {formatTime(movement.estimatedTime)}</div>
                        {movement.actualTime && (
                          <div className="text-xs text-gray-900">Real: {formatTime(movement.actualTime)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onMovementClick(movement.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {movement.hasIncident && movement.incidentId && onIncidentClick && (
                          <button
                            onClick={() => onIncidentClick(movement.incidentId!)}
                            className="text-red-600 hover:text-red-900"
                            title="Ver incidencia"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAndSortedMovements.length)} de {filteredAndSortedMovements.length} resultados
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === totalPages
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
