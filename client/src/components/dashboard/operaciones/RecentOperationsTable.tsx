import React, { useMemo, useState } from 'react';
import { useTransferOperations } from '../../../hooks';
import { TransferOperation } from '../../../types';

interface Props {
  search?: string;
}

const statusBadgeClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20';
    case 'registered':
      return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20';
    case 'error':
      return 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20';
    default:
      return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20';
  }
};

const amountStr = (op: TransferOperation) => {
  const locale = op.currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: op.currency }).format(op.totalAmount);
};

const clientStr = (op: TransferOperation) => {
  const names = (op.distributionLines || []).map((l) => l.contactName).filter(Boolean) as string[];
  if (!names.length) return '—';
  if (names.length === 1) return names[0]!;
  return `${names[0]} + ${names.length - 1} más`;
};

const typeStr = (op: TransferOperation) => {
  const mt = op.movementType;
  if (mt === 'cash') return 'Efectivo';
  if (mt === 'transfer') return 'Transferencia';
  return mt;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isSameDay) return `Hoy ${h}:${m}`;
  if (isYesterday) return `Ayer ${h}:${m}`;
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${h}:${m}`;
};

const initialsFromName = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return 'FT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const detailedDate = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const formatted = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatted} ${time}`;
};

export const RecentOperationsTable: React.FC<Props> = ({ search = '' }) => {
  const transferOptions = useMemo(() => ({ limit: 10, skip: 0, query: search }), [search]);
  const { items, loading, error, refresh } = useTransferOperations(transferOptions);
  const [mobileTypeFilter, setMobileTypeFilter] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (!mobileTypeFilter) {
      return items;
    }
    return items.filter((op) => typeStr(op).toLowerCase().includes(mobileTypeFilter.toLowerCase()));
  }, [items, mobileTypeFilter]);

  return (
    <section id="recent-operations" className="mb-6 lg:mb-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-1">
                Operaciones recientes
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Últimas operaciones registradas en el sistema
              </p>
            </div>
            <button className="text-primary hover:underline font-medium text-sm lg:text-base">
              Ver historial
            </button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="mobile-type-filter">
              Filtros rápidos
            </label>
            <button
              type="button"
              className="flex items-center text-sm text-primary hover:underline"
              onClick={() => setMobileTypeFilter('')}
            >
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <div className="relative">
                <select
                  id="mobile-type-filter"
                  value={mobileTypeFilter}
                  onChange={(event) => setMobileTypeFilter(event.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="">Todos los tipos</option>
                  <option value="compra">Compra</option>
                  <option value="venta">Venta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              onClick={() => undefined}
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Mobile list */}
        <div className="lg:hidden divide-y divide-gray-200">
          {loading && (
            <div className="p-4 space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse mr-3" />
                      <div>
                        <div className="h-4 w-32 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                        <div className="h-3 w-24 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse mt-1" />
                      </div>
                    </div>
                    <div className="h-4 w-16 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx}>
                        <div className="h-3 w-20 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                        <div className="h-4 w-24 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                    <div className="flex space-x-3">
                      <div className="h-4 w-12 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                      <div className="h-4 w-12 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredItems.map((op) => {
            const clientName = clientStr(op);
            const avatar = initialsFromName(clientName);
            const statusClass = statusBadgeClass(op.status);

            return (
              <div key={op.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium mr-3">
                      {avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{clientName}</div>
                      <div className="text-xs text-gray-500">{detailedDate(op.confirmedAt || op.createdAt)}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                    {typeStr(op)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Monto total</div>
                    <div className="text-sm font-medium text-text-primary">{amountStr(op)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Participantes</div>
                    <div className="text-sm font-medium text-text-primary">
                      {op.distributionLines.length} contacto{op.distributionLines.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Tipo de movimiento</div>
                    <div className="text-sm font-medium text-text-primary">{typeStr(op)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Estado</div>
                    <div className="text-sm font-medium text-text-primary">{op.status || '—'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                    {op.status || '—'}
                  </span>
                  <div className="flex space-x-3">
                    <button className="text-primary hover:text-blue-700 text-sm">Ver</button>
                    <button className="text-gray-600 hover:text-gray-900 text-sm">Editar</button>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && error && (
            <div className="p-4 text-sm text-gray-600 flex items-center justify-between">
              <span>Error al cargar operaciones. Verifica tu conexión.</span>
              <button onClick={() => refresh()} className="text-primary hover:underline">
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 w-24 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}

              {!loading && !error &&
                items.map((op) => (
                  <tr key={op.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{op.operationCode || op.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeStr(op)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clientStr(op)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{amountStr(op)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(op.status)}`}>
                        {op.status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(op.confirmedAt || op.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary hover:underline">Ver</button>
                    </td>
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={7}>
                    <div className="flex items-center justify-between">
                      <span>Error al cargar operaciones. Verifica tu conexión.</span>
                      <button onClick={() => refresh()} className="text-primary hover:underline">
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
