import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransferOperations, useLatestMarketRate } from '../../../hooks';
import { TransferOperation } from '../../../types';
import { Button } from '../../shared/design-system';

interface Props {
  search?: string;
}

interface TableRow {
  id: string;
  dateLabel: string;
  clientName: string;
  clientIdentifier: string;
  clientInitials: string;
  typeLabel: 'Compra' | 'Venta' | 'Liquidación';
  typeClassName: string;
  receivesText: string;
  paysText: string;
  rateLabel: string;
  marginLabel: string;
  marginClassName: string;
  statusLabel: string;
  statusClassName: string;
  isEditable: boolean;
}

const TYPE_BADGE_CLASS: Record<'Compra' | 'Venta' | 'Liquidación', string> = {
  Compra:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-success bg-opacity-10 text-success',
  Venta:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary bg-opacity-10 text-primary',
  Liquidación:
    'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800',
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: 'Completada',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
  },
  completed: {
    label: 'Completada',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800',
  },
  registered: {
    label: 'En proceso',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800',
  },
  pending: {
    label: 'Pendiente',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700',
  },
  error: {
    label: 'Con error',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-danger',
  },
  draft: {
    label: 'Borrador',
    className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600',
  },
};

const DEFAULT_STATUS = {
  label: 'Registrada',
  className: 'inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700',
};

const formatCurrencyLabel = (amount: number | null | undefined, currency: string) => {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }

  const safeCurrency = (currency || 'ARS').toUpperCase();
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: safeCurrency === 'USD' ? 'USD' : safeCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let formatted = formatter.format(Math.abs(amount));
  if (safeCurrency === 'ARS' || safeCurrency === 'AR$') {
    formatted = formatted.replace(/\s+/g, '').replace('AR$', '$').replace('ARS', '$');
  } else if (safeCurrency === 'USD') {
    formatted = formatted.replace('US$', 'USD').replace(/\s+/g, ' ');
    if (!formatted.startsWith('USD')) {
      formatted = `USD ${formatted.trim()}`;
    }
  }
  return formatted;
};

const formatRateLabel = (rate: number | null) => {
  if (!rate || Number.isNaN(rate)) {
    return '—';
  }
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(rate).replace(/\s+/g, '').replace('AR$', '$');
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) {
    return 'FT';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const sumByMethod = (lines: TransferOperation['distributionLines']) =>
  (lines || []).reduce<Record<string, number>>((acc, line) => {
    const method = (line.method || '').toUpperCase();
    const amount = Math.abs(line.amount || 0);
    if (!method) {
      return acc;
    }
    acc[method] = (acc[method] || 0) + amount;
    return acc;
  }, {});

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const absolute = Math.abs(value * 100);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(absolute);
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${formatted}%`;
};

const getClientName = (operation: TransferOperation) => {
  const names =
    operation.distributionLines
      ?.map((line) => line.contactName)
      .filter((name): name is string => Boolean(name)) ?? [];
  if (!names.length) {
    return 'Cliente sin asignar';
  }
  if (names.length === 1) {
    return names[0];
  }
  return `${names[0]} y ${names.length - 1} más`;
};

const buildClientIdentifier = (operation: TransferOperation) => {
  if (operation.operationCode) {
    return `Operación ${operation.operationCode}`;
  }
  return 'CUIT: —';
};

const getTypeLabel = (operation: TransferOperation): 'Compra' | 'Venta' | 'Liquidación' => {
  // Por ahora, identificamos liquidaciones basándonos en el código de operación o algún patrón específico
  // Esto puede ajustarse cuando se tenga más información sobre cómo identificar liquidaciones
  if (operation.operationCode && operation.operationCode.includes('LIQ')) {
    return 'Liquidación';
  }
  // Lógica corregida para compra/venta desde perspectiva de tesorería:
  // Compra: Cliente compra USD, paga ARS → ARS entra a tesorería (direction: 'incoming')
  // Venta: Cliente vende USD, recibe ARS → ARS sale de tesorería (direction: 'outgoing')
  return (operation.direction || '').toLowerCase() === 'incoming' ? 'Compra' : 'Venta';
};

const computeFinancials = (
  operation: TransferOperation,
  typeLabel: 'Compra' | 'Venta' | 'Liquidación',
  marketRate: number | null
) => {
  const totals = sumByMethod(operation.distributionLines || []);
  const baseCurrency = (operation.currency || '').toUpperCase();
  const totalAmount = Math.abs(operation.totalAmount || 0);

  if (baseCurrency && !totals[baseCurrency]) {
    totals[baseCurrency] = (totals[baseCurrency] || 0) + totalAmount;
  }

  const arsAmount = totals.ARS ?? (baseCurrency === 'ARS' ? totalAmount : 0);
  const usdAmount = totals.USD ?? (baseCurrency === 'USD' ? totalAmount : 0);

  let entersCurrency: 'ARS' | 'USD';
  let saleCurrency: 'ARS' | 'USD';
  let entersAmount = 0;
  let saleAmount = 0;

  if (typeLabel === 'Venta') {
    // Sell: Client receives ARS, pays USD
    entersCurrency = 'ARS';
    saleCurrency = 'USD';
    entersAmount = arsAmount || (usdAmount && marketRate ? usdAmount * marketRate : totalAmount);
    saleAmount = usdAmount || (entersAmount && marketRate ? entersAmount / marketRate : 0);
  } else {
    // Buy: Client receives USD, pays ARS
    entersCurrency = 'USD';
    saleCurrency = 'ARS';
    saleAmount = arsAmount || (usdAmount && marketRate ? usdAmount * marketRate : totalAmount);
    entersAmount = usdAmount || (saleAmount && marketRate ? saleAmount / marketRate : 0);
  }

  const effectiveRate =
    saleCurrency === 'ARS' && entersCurrency === 'USD' && entersAmount
      ? saleAmount / entersAmount
      : entersCurrency === 'ARS' && saleCurrency === 'USD' && saleAmount
      ? entersAmount / saleAmount
      : marketRate || null;

  return {
    receivesText: formatCurrencyLabel(entersAmount, entersCurrency),
    paysText: formatCurrencyLabel(saleAmount, saleCurrency),
    effectiveRate: effectiveRate && Number.isFinite(effectiveRate) ? effectiveRate : null,
  };
};

const calculateMargin = (
  effectiveRate: number | null,
  marketRate: number | null,
  typeLabel: 'Compra' | 'Venta' | 'Liquidación'
) => {
  if (!effectiveRate || !marketRate || Number.isNaN(effectiveRate) || effectiveRate <= 0) {
    return { marginLabel: '—', marginClassName: 'text-gray-600' };
  }
  const rawMargin = (marketRate - effectiveRate) / marketRate;
  const adjustedMargin = typeLabel === 'Compra' ? rawMargin : -rawMargin;
  const marginLabel = formatPercentage(adjustedMargin);
  const marginClassName =
    adjustedMargin > 0.0001
      ? 'text-success font-medium'
      : adjustedMargin < -0.0001
      ? 'text-danger font-medium'
      : 'text-gray-600';
  return { marginLabel, marginClassName };
};

const formatTableRows = (
  operations: TransferOperation[],
  marketRate: number | null
): TableRow[] =>
  operations.map((operation) => {
    const typeLabel = getTypeLabel(operation);
    const { receivesText, paysText, effectiveRate } = computeFinancials(
      operation,
      typeLabel,
      marketRate
    );
    const { marginLabel, marginClassName } = calculateMargin(effectiveRate, marketRate, typeLabel);
    const statusNormalized = (operation.status || '').toLowerCase();
    const statusInfo =
      STATUS_MAP[statusNormalized] ?? {
        ...DEFAULT_STATUS,
      };

    const isEditable = !['confirmed', 'completed', 'voided', 'cancelled'].includes(statusNormalized);

    const clientName = getClientName(operation);

    return {
      id: operation.id,
      dateLabel: formatDateTime(operation.createdAt || operation.confirmedAt),
      clientName,
      clientIdentifier: buildClientIdentifier(operation),
      clientInitials: getInitials(clientName),
      typeLabel,
      typeClassName: TYPE_BADGE_CLASS[typeLabel],
      receivesText,
      paysText,
      rateLabel: formatRateLabel(effectiveRate),
      marginLabel,
      marginClassName,
      statusLabel: statusInfo.label,
      statusClassName: statusInfo.className,
      isEditable,
    };
  });

export const RecentOperationsTable: React.FC<Props> = ({ search = '' }) => {
  const navigate = useNavigate();
  const transferOptions = useMemo(() => ({ limit: 10, skip: 0, query: search }), [search]);
  const { items, loading, error, refresh } = useTransferOperations(transferOptions);
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: latestMarketRate } = useLatestMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' });

  const latestRate = latestMarketRate?.rate ?? null;

  const handleViewDetail = (operationId: string) => {
    // Navigate to the transfer details page
    navigate(`/dashboard/operaciones/transfer-pesos/detalle/${operationId}`);
  };

  const handleEditOperation = (row: TableRow) => {
    if (!row.isEditable) {
      return;
    }

    const tipoParam = row.typeLabel === 'Venta' ? 'venta' : row.typeLabel === 'Compra' ? 'compra' : '';
    const searchSuffix = tipoParam ? `&tipo=${tipoParam}` : '';
    navigate(`/dashboard/operaciones/nueva?draftId=${row.id}${searchSuffix}`);
  };

  const rows = useMemo(() => formatTableRows(items, latestRate), [items, latestRate]);

  const clientOptions = useMemo(() => {
    const unique = new Set<string>();
    rows.forEach((row) => {
      if (row.clientName) {
        unique.add(row.clientName);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (clientFilter !== 'all' && row.clientName !== clientFilter) {
          return false;
        }
        if (typeFilter !== 'all' && row.typeLabel !== typeFilter) {
          return false;
        }
        return true;
      }),
    [rows, clientFilter, typeFilter]
  );

  return (
    <section id="recent-operations" className="mb-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-1">Últimas operaciones</h2>
              <p className="text-gray-600 text-sm lg:text-base">Registro de operaciones más recientes</p>
            </div>
            <button type="button" className="text-primary hover:underline font-medium">
              Ver historial completo
            </button>
          </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <div className="h-4 w-10 rounded bg-gray-200" />
                        <div className="h-4 w-10 rounded bg-gray-200" />
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-600">
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
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-600">
                    No se encontraron operaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {row.dateLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm font-medium">
                            {row.clientInitials}
                          </span>
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
                      <div><span className="text-gray-500 mr-1">Entra:</span>{row.receivesText}</div>
                      <div><span className="text-gray-500 mr-1">Sale:</span>{row.paysText}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                      {row.rateLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={row.marginClassName}>{row.marginLabel}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={row.statusClassName}>{row.statusLabel}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(row.id)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900"
                          disabled={!row.isEditable}
                          onClick={() => handleEditOperation(row)}
                        >
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`mobile-skeleton-${index}`} className="p-4 border-b border-gray-200 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-3" />
                    <div>
                      <div className="h-4 w-24 rounded bg-gray-200 mb-1" />
                      <div className="h-3 w-20 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded bg-gray-200" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="h-5 w-20 rounded bg-gray-200" />
                  <div className="flex space-x-2">
                    <div className="h-6 w-12 rounded bg-gray-200" />
                    <div className="h-6 w-12 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}

          {!loading && error && (
            <div className="p-6 text-center text-sm text-gray-600">
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
            </div>
          )}

          {!loading && !error && filteredRows.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-600">
              No se encontraron operaciones con los filtros seleccionados.
            </div>
          )}

          {!loading &&
            !error &&
            filteredRows.map((row) => (
              <div key={`mobile-${row.id}`} className="p-4 border-b border-gray-200 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 text-sm font-medium">
                        {row.clientInitials}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{row.clientName}</div>
                      <div className="text-xs text-gray-500">{row.clientIdentifier}</div>
                    </div>
                  </div>
                  <span className={row.typeClassName}>{row.typeLabel}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha:</span>
                    <span className="text-text-primary">{row.dateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TC Efectivo:</span>
                    <span className="font-medium text-text-primary">{row.rateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Margen:</span>
                    <span className={row.marginClassName}>{row.marginLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bien entra/sale:</span>
                    <div className="text-right">
                      <div className="text-xs"><span className="text-gray-500 mr-1">Entra:</span>{row.receivesText}</div>
                      <div className="text-xs"><span className="text-gray-500 mr-1">Sale:</span>{row.paysText}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className={row.statusClassName}>{row.statusLabel}</span>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(row.id)}
                      className="text-xs"
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900 text-xs"
                      disabled={!row.isEditable}
                      onClick={() => handleEditOperation(row)}
                    >
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};
