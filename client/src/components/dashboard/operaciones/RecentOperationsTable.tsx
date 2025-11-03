import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardOperations } from '../../../hooks';
import { DashboardOperationRow } from '../../../types';
import { Button } from '../../shared/design-system';

interface Props {
  search?: string;
  limit?: number;
  variant?: 'full' | 'compact';
}

const buildClientOptions = (rows: DashboardOperationRow[]) => {
  const unique = new Set<string>();
  rows.forEach((row) => {
    if (row.clientName) {
      unique.add(row.clientName);
    }
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
};

const filterBySearch = (rows: DashboardOperationRow[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return rows;
  }
  return rows.filter((row) => {
    return (
      row.clientName.toLowerCase().includes(normalized) ||
      (row.clientIdentifier || '').toLowerCase().includes(normalized) ||
      (row.typeLabel || '').toLowerCase().includes(normalized)
    );
  });
};

export const RecentOperationsTable: React.FC<Props> = ({
  search = '',
  limit = 10,
  variant = 'full',
}) => {
  const navigate = useNavigate();
  const { items, loading, error, refresh } = useDashboardOperations({ limit });

  const [clientFilter, setClientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const rows = useMemo(() => filterBySearch(items, search), [items, search]);

  const clientOptions = useMemo(() => buildClientOptions(rows), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (clientFilter !== 'all' && row.clientName !== clientFilter) {
        return false;
      }
      if (typeFilter !== 'all' && row.typeLabel !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [rows, clientFilter, typeFilter]);

  const showFilters = variant === 'full';
  const showHistoryButton = variant === 'full';
  const showActionsColumn = variant === 'full';
  const containerClassName = variant === 'compact' ? 'mb-6' : 'mb-8';

  const handleViewDetail = (row: DashboardOperationRow) => {
    if (!row.detailPath) {
      return;
    }
    navigate(row.detailPath);
  };

  const handleEditOperation = (row: DashboardOperationRow) => {
    if (!row.isEditable || !row.editPath) {
      return;
    }
    navigate(row.editPath);
  };

  const handleViewHistory = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  return (
    <section id="recent-operations" className={containerClassName}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-1">Últimas operaciones</h2>
              <p className="text-gray-600 text-sm lg:text-base">Registro de operaciones más recientes</p>
            </div>
            {showHistoryButton && (
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={handleViewHistory}
              >
                Ver historial completo
              </button>
            )}
          </div>

          {showFilters && (
            <div id="quick-filters" className="grid grid-cols-1 gap-3 lg:flex lg:flex-wrap lg:gap-4">
              <div className="relative">
                <select
                  value={clientFilter}
                  onChange={(event) => setClientFilter(event.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 lg:px-4 py-2 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base w-full lg:w-auto"
                >
                  <option value="all">Todos los clientes</option>
                  {clientOptions.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 lg:px-4 py-2 pr-8 focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base w-full lg:w-auto"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="Compra">Compra</option>
                  <option value="Venta">Venta</option>
                  <option value="Liquidación">Liquidación</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bien entra/sale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TC Efectivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margen %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                {showActionsColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-28 rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-3" />
                        <div>
                          <div className="h-4 w-32 rounded bg-gray-200 mb-2" />
                          <div className="h-3 w-24 rounded bg-gray-200" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="h-3 w-28 rounded bg-gray-200" />
                        <div className="h-3 w-24 rounded bg-gray-200" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 rounded bg-gray-200" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 w-20 rounded bg-gray-200" />
                    </td>
                    {showActionsColumn && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <div className="h-4 w-10 rounded bg-gray-200" />
                          <div className="h-4 w-10 rounded bg-gray-200" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td colSpan={showActionsColumn ? 8 : 7} className="px-6 py-12 text-center text-sm text-gray-600">
                    <div className="flex flex-col items-center space-y-3">
                      <i className="fa-solid fa-triangle-exclamation text-danger text-lg" />
                      <p>Ocurrió un error al cargar las operaciones.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refresh().catch(() => {})}
                      >
                        Reintentar
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={showActionsColumn ? 8 : 7} className="px-6 py-12 text-center text-sm text-gray-600">
                    No se encontraron operaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRows.map((row) => (
                  <tr key={row.id ?? row.createdAt} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{row.dateLabel}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">{row.clientInitials}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{row.clientName}</div>
                          <div className="text-sm text-gray-500">{row.clientIdentifier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={row.typeClassName}>{row.typeLabel}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <div>
                        <span className="text-gray-500 mr-1">Entra:</span>
                        {row.receivesText}
                      </div>
                      <div>
                        <span className="text-gray-500 mr-1">Sale:</span>
                        {row.paysText}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{row.rateLabel}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${row.marginClassName}`}>
                      {row.marginLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={row.statusClassName}>{row.statusLabel}</span>
                    </td>
                    {showActionsColumn && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => handleViewDetail(row)}
                            disabled={!row.detailPath}
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            className={`text-gray-500 hover:underline ${
                              row.isEditable && row.editPath ? 'text-primary' : 'cursor-not-allowed'
                            }`}
                            onClick={() => handleEditOperation(row)}
                            disabled={!row.isEditable || !row.editPath}
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {loading && (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`card-skeleton-${index}`} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredRows.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-600">
              No se encontraron operaciones con los filtros seleccionados.
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-6 text-center text-sm text-gray-600">
              <p className="mb-3">Ocurrió un error al cargar las operaciones.</p>
              <Button variant="ghost" size="sm" onClick={() => refresh().catch(() => {})}>
                Reintentar
              </Button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredRows.map((row) => (
              <div key={row.id ?? row.createdAt} className="border border-gray-200 rounded-lg p-4 m-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{row.clientName}</div>
                    <div className="text-xs text-gray-500">{row.clientIdentifier}</div>
                  </div>
                  <span className={row.typeClassName}>{row.typeLabel}</span>
                </div>

                <div className="space-y-1 text-sm text-text-primary mb-3">
                  <div className="text-gray-500">{row.dateLabel}</div>
                  <div>
                    <span className="text-gray-500 mr-1">Entra:</span>
                    {row.receivesText}
                  </div>
                  <div>
                    <span className="text-gray-500 mr-1">Sale:</span>
                    {row.paysText}
                  </div>
                  <div>
                    <span className="text-gray-500 mr-1">TC:</span>
                    {row.rateLabel}
                  </div>
                  <div className={row.marginClassName}>Margen: {row.marginLabel}</div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={row.statusClassName}>{row.statusLabel}</span>
                  <div className="flex items-center space-x-3 text-sm">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => handleViewDetail(row)}
                      disabled={!row.detailPath}
                    >
                      Ver
                    </button>
                    {showActionsColumn && (
                      <button
                        type="button"
                        className={`hover:underline ${
                          row.isEditable && row.editPath ? 'text-primary' : 'text-gray-400 cursor-not-allowed'
                        }`}
                        onClick={() => handleEditOperation(row)}
                        disabled={!row.isEditable || !row.editPath}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
