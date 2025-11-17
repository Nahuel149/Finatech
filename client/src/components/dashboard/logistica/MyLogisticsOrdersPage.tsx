import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../ui/Alert';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import {
  ApiError,
  LogisticsOrder,
  LogisticsOrderStatus,
  LogisticsOrderType,
} from '../../../types';
import { useLogisticsOrderActions, useMyLogisticsOrders } from '../../../hooks/dashboard';
import { formatDateTime } from '../operaciones/transfer/utils';
import { OfflineSyncBanner } from './OfflineSyncBanner';

const ACTIVE_STATUSES: LogisticsOrderStatus[] = ['PROGRAMADA', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO'];

const STATUS_LABELS: Record<LogisticsOrderStatus, string> = {
  BORRADOR: 'Borrador',
  PROGRAMADA: 'Programada',
  ASIGNADA: 'Asignada',
  EN_CAMINO: 'En camino',
  EN_SITIO: 'En sitio',
  COMPLETADA: 'Completada',
  COMPLETADA_TOTAL: 'Completada total',
  COMPLETADA_PARCIAL: 'Completada parcial',
  DISCREPANCIA: 'Discrepancia',
  CANCELADA: 'Cancelada',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  normal: 'bg-slate-100 text-slate-800',
  low: 'bg-emerald-100 text-emerald-800',
};

const STATUS_BADGES: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  PROGRAMADA: 'bg-indigo-100 text-indigo-800',
  ASIGNADA: 'bg-blue-100 text-blue-800',
  EN_CAMINO: 'bg-amber-100 text-amber-900',
  EN_SITIO: 'bg-emerald-100 text-emerald-800',
  COMPLETADA: 'bg-green-100 text-green-800',
  COMPLETADA_TOTAL: 'bg-green-100 text-green-800',
  COMPLETADA_PARCIAL: 'bg-lime-100 text-lime-800',
  DISCREPANCIA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-gray-200 text-gray-600',
};

const ORDER_TYPE_LABEL: Record<LogisticsOrderType, string> = {
  RETIRO: 'Retiro',
  ENTREGA: 'Entrega',
};

const requestLocation = (): Promise<{ gpsLat?: number; gpsLng?: number }> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          gpsLat: position.coords.latitude,
          gpsLng: position.coords.longitude,
        });
      },
      () => reject(new Error('No pudimos obtener tu ubicación. Activá el GPS e intentá nuevamente.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

export const MyLogisticsOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LogisticsOrderType>('ALL');
  const [statusFilter, setStatusFilter] = useState<LogisticsOrderStatus[]>(() =>
    Object.keys(STATUS_LABELS) as LogisticsOrderStatus[]
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionMessage, setActionMessage] = useState<ApiError | null>(null);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const { orders, loading, error, setFilters, refresh } = useMyLogisticsOrders({});

  const {
    startRoute,
    arriveOnSite,
    pendingActions,
    runningAction,
    error: actionError,
    retryPendingActions,
    clearOfflineQueue,
  } = useLogisticsOrderActions();

  useEffect(() => {
    setFilters({
      status: statusFilter,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search || undefined,
    });
  }, [statusFilter, typeFilter, dateFrom, dateTo, search, setFilters]);

  const filteredOrders = useMemo(() => {
    if (typeFilter === 'ALL' && !search) {
      return orders;
    }
    return orders.filter((order) => {
      const matchesType = typeFilter === 'ALL' || order.type === typeFilter;
      const haystack = [
        order.orderNumber,
        order.operationCode,
        order.origin,
        order.destination,
        order.contactName,
        order.contactPhone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = search ? haystack.includes(search.toLowerCase()) : true;
      return matchesType && matchesSearch;
    });
  }, [orders, typeFilter, search]);

  const handleStartRoute = async (orderId: string) => {
    try {
      setActionMessage(null);
      await startRoute(orderId);
      await refresh();
    } catch (err) {
      setActionMessage(err as ApiError);
    }
  };

  const handleArrive = async (orderId: string) => {
    try {
      setActionMessage(null);
      const coords = await requestLocation();
      await arriveOnSite(orderId, coords);
      await refresh();
    } catch (err) {
      setActionMessage(err as ApiError);
    }
  };

  const handleRetryOffline = async () => {
    setSyncingOffline(true);
    try {
      await retryPendingActions();
      await refresh();
    } finally {
      setSyncingOffline(false);
    }
  };

  const renderOrderActions = (order: LogisticsOrder) => {
    const baseBtn =
      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60';

    if (order.status === 'PROGRAMADA' || order.status === 'ASIGNADA') {
      return (
        <button
          type="button"
          className={`${baseBtn} bg-primary text-white hover:bg-blue-700`}
          onClick={() => handleStartRoute(order.id)}
          disabled={runningAction === 'start-route'}
        >
          <i className="fa-solid fa-route" aria-hidden="true" />
          En camino
        </button>
      );
    }

    if (order.status === 'EN_CAMINO') {
      return (
        <button
          type="button"
          className={`${baseBtn} bg-amber-500 text-white hover:bg-amber-600`}
          onClick={() => handleArrive(order.id)}
          disabled={runningAction === 'arrive'}
        >
          <i className="fa-solid fa-location-crosshairs" aria-hidden="true" />
          En sitio
        </button>
      );
    }

    if (order.status === 'EN_SITIO') {
      return (
        <button
          type="button"
          className={`${baseBtn} border border-emerald-600 text-emerald-700 hover:bg-emerald-50`}
          onClick={() => navigate(`/dashboard/logistica/orden/${order.id}`)}
        >
          <i className="fa-solid fa-list-check" aria-hidden="true" />
          Gestionar entrega
        </button>
      );
    }

    return (
      <button
        type="button"
        className={`${baseBtn} border border-gray-200 text-gray-600 hover:bg-gray-50`}
        onClick={() => navigate(`/dashboard/logistica/orden/${order.id}`)}
      >
        Ver detalle
      </button>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-gray-500">Vista del logístico</p>
            <h2 className="text-xl font-semibold text-text-primary">Mis órdenes activas</h2>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Actualizar lista"
          >
            <i className="fa-solid fa-rotate" aria-hidden="true" />
            Actualizar
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-xs uppercase text-gray-500">
              Buscar
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="OL-2025-000123, contacto, dirección…"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              />
            </label>
          </div>
          <label className="text-xs uppercase text-gray-500">
            Tipo
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'ALL' | LogisticsOrderType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            >
              <option value="ALL">Todos</option>
              <option value="RETIRO">Retiros</option>
              <option value="ENTREGA">Entregas</option>
            </select>
          </label>
          <label className="text-xs uppercase text-gray-500">
            Desde
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Hasta
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase text-gray-500">Estados visibles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([value, label]) => {
              const active = statusFilter.includes(value as LogisticsOrderStatus);
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setStatusFilter((current) =>
                      active
                        ? current.filter((status) => status !== value)
                        : [...current, value as LogisticsOrderStatus]
                    );
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <OfflineSyncBanner
        pendingActions={pendingActions}
        onRetry={handleRetryOffline}
        onClear={clearOfflineQueue}
        syncing={syncingOffline}
        error={actionError || actionMessage || undefined}
      />

      {actionError && <Alert type="error" message={actionError.message} />}
      {actionMessage && <Alert type="error" message={actionMessage.message} />}
      {error && <Alert type="error" message={error.message} />}

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {!filteredOrders.length && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-8 text-center">
              <p className="text-sm text-gray-500">
                No hay órdenes con los filtros aplicados. Ajustá la búsqueda o esperá nuevas asignaciones.
              </p>
            </div>
          )}

          {filteredOrders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {ORDER_TYPE_LABEL[order.type]} · Ventana {formatDateTime(order.windowStart)} –{' '}
                    {formatDateTime(order.windowEnd)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[order.priority] || 'bg-slate-100 text-slate-800'
                      }`}
                  >
                    {order.priority === 'urgent'
                      ? 'Urgente'
                      : order.priority === 'high'
                      ? 'Alta'
                      : order.priority === 'low'
                      ? 'Baja'
                      : 'Normal'}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase text-gray-500">Origen</p>
                  <p className="text-sm font-medium text-text-primary">{order.origin}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Destino</p>
                  <p className="text-sm font-medium text-text-primary">{order.destination}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Contacto</p>
                  <p className="text-sm font-medium text-text-primary">{order.contactName}</p>
                  <p className="text-xs text-gray-500">{order.contactPhone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Ítems</p>
                  <p className="text-sm font-medium text-text-primary">
                    {order.items.length} ·{' '}
                    {order.items
                      .map((item) => `${item.assetCode} (${item.assetType})`)
                      .slice(0, 2)
                      .join(', ')}
                    {order.items.length > 2 ? '…' : ''}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {renderOrderActions(order)}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  onClick={() => navigate(`/dashboard/logistica/orden/${order.id}`)}
                >
                  <i className="fa-solid fa-eye" aria-hidden="true" />
                  Ver detalle
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
