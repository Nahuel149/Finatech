import React, { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardOperations } from '../../../hooks/dashboard/useDashboardOperations';
import { DashboardOperationRow } from '../../../types/dashboard';
import { Button } from '../../shared/design-system/Button';

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

const listVisibilityStyle: React.CSSProperties = {
  contentVisibility: 'auto',
  containIntrinsicSize: '700px',
};

type RecentOperationRowProps = {
  row: DashboardOperationRow;
  showActionsColumn: boolean;
  onViewDetail: (row: DashboardOperationRow) => void;
  onEditOperation: (row: DashboardOperationRow) => void;
};

const RecentOperationRow = React.memo(
  ({ row, showActionsColumn, onViewDetail, onEditOperation }: RecentOperationRowProps) => (
    <tr className="hover:bg-gray-50">
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
              onClick={() => onViewDetail(row)}
              disabled={!row.detailPath}
            >
              Ver detalle
            </button>
            <button
              type="button"
              className={`text-gray-500 hover:underline ${
                row.isEditable && row.editPath ? 'text-primary' : 'cursor-not-allowed'
              }`}
              onClick={() => onEditOperation(row)}
              disabled={!row.isEditable || !row.editPath}
            >
              Editar
            </button>
          </div>
        </td>
      )}
    </tr>
  )
);

type RecentOperationCardProps = {
  row: DashboardOperationRow;
  avatarClass: string;
  showActionsColumn: boolean;
  onViewDetail: (row: DashboardOperationRow) => void;
  onEditOperation: (row: DashboardOperationRow) => void;
};

const RecentOperationCard = React.memo(
  ({ row, avatarClass, showActionsColumn, onViewDetail, onEditOperation }: RecentOperationCardProps) => (
    <div className="border border-gray-200 rounded-xl p-4 mx-4 mb-4 shadow-sm bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${avatarClass}`}>
            {row.clientInitials}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{row.clientName}</div>
            <div className="text-xs text-gray-500">{row.dateLabel}</div>
          </div>
        </div>
        <span className={`${row.typeClassName} text-xs px-2 py-1 rounded-full leading-tight`}>
          {row.typeLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-text-primary mb-3">
        <div>
          <div className="text-xs text-gray-500">Entra</div>
          <div className="font-medium">{row.receivesText}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Sale</div>
          <div className="font-medium">{row.paysText}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">TC Efectivo</div>
          <div className="font-medium">{row.rateLabel}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Margen</div>
          <div className={`font-medium ${row.marginClassName}`}>{row.marginLabel}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={`${row.statusClassName} px-2 py-1 rounded-full text-xs`}>{row.statusLabel}</span>
        <div className="flex items-center space-x-4 text-sm">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => onViewDetail(row)}
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
              onClick={() => onEditOperation(row)}
              disabled={!row.isEditable || !row.editPath}
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  )
);

export const RecentOperationsTable: React.FC<Props> = ({
  search = '',
  limit: initialLimit = 10,
  variant = 'full',
}) => {
  const navigate = useNavigate();
  const historyPageSize = 15;
  const [historyMode, setHistoryMode] = useState(false);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const pageSize = historyMode ? historyPageSize : initialLimit;
  const currentPage = historyMode ? page : 1;

  const { items, loading, error, refresh, pagination } = useDashboardOperations({
    limit: pageSize,
    page: currentPage,
  });

  const [clientFilter, setClientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!historyMode) {
      setPage(1);
    }
  }, [historyMode]);

  useEffect(() => {
    if (historyMode) {
      setPage(1);
    }
  }, [clientFilter, typeFilter, search, historyMode]);

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

  const totalPages = historyMode ? pagination?.totalPages || 1 : 1;
  const totalItems = historyMode ? pagination?.total || filteredRows.length : filteredRows.length;

  const showFilters = variant === 'full';
  const showHistoryButton = variant === 'full';
  const showActionsColumn = variant === 'full';
  const containerClassName = variant === 'compact' ? 'mb-6' : 'mb-8';
  const avatarPalette = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
  ];

  const getAvatarClass = (name: string) => {
    if (!name) return avatarPalette[0];
    const code = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarPalette[code % avatarPalette.length];
  };

  const handleViewDetail = useCallback((row: DashboardOperationRow) => {
    if (!row.detailPath) {
      return;
    }
    navigate(row.detailPath);
  }, [navigate]);

  const handleEditOperation = useCallback((row: DashboardOperationRow) => {
    if (!row.isEditable || !row.editPath) {
      return;
    }
    navigate(row.editPath);
  }, [navigate]);

  const handleClientFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      startTransition(() => {
        setClientFilter(value);
      });
    },
    [startTransition]
  );

  const handleTypeFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      startTransition(() => {
        setTypeFilter(value);
      });
    },
    [startTransition]
  );

  const handleViewHistory = () => {
    setHistoryMode((prev) => !prev);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    const sanitized = Math.min(Math.max(nextPage, 1), Math.max(totalPages, 1));
    setPage(sanitized);
  };

  return (
    <section id="recent-operations" className={containerClassName}>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-text-primary leading-tight">Últimas operaciones</h2>
              <p className="text-gray-600 text-sm lg:text-base leading-snug">Registro de operaciones más recientes</p>
            </div>
            {showHistoryButton && (
              <button
                type="button"
                className="text-primary hover:underline text-sm font-medium leading-tight text-right"
                onClick={handleViewHistory}
              >
                {historyMode ? (
                  'Volver a recientes'
                ) : (
                  <>
                    Ver historial<br />completo
                  </>
                )}
              </button>
            )}
          </div>

          {showFilters && (
            <div id="quick-filters" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:gap-4">
              <div className="relative">
                <select
                  value={clientFilter}
                  onChange={handleClientFilterChange}
                  className="appearance-none bg-white border border-gray-300 rounded-lg h-10 px-3 pr-9 text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:border-primary w-full lg:w-auto shadow-sm"
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
                  onChange={handleTypeFilterChange}
                  className="appearance-none bg-white border border-gray-300 rounded-lg h-10 px-3 pr-9 text-sm font-medium text-text-primary focus:ring-2 focus:ring-primary focus:border-primary w-full lg:w-auto shadow-sm"
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
        <div className="hidden lg:block overflow-x-auto" style={listVisibilityStyle}>
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
                  <RecentOperationRow
                    key={row.id ?? row.createdAt}
                    row={row}
                    showActionsColumn={showActionsColumn}
                    onViewDetail={handleViewDetail}
                    onEditOperation={handleEditOperation}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden" style={listVisibilityStyle}>
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
              <RecentOperationCard
                key={row.id ?? row.createdAt}
                row={row}
                avatarClass={getAvatarClass(row.clientName)}
                showActionsColumn={showActionsColumn}
                onViewDetail={handleViewDetail}
                onEditOperation={handleEditOperation}
              />
            ))}
        </div>

        {historyMode && !loading && !error && totalItems > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 lg:px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Pagina {currentPage} de {totalPages} &bull; {totalItems} operaciones
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
