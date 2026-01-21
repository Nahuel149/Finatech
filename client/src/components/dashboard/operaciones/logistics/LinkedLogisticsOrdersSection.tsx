import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { ApiError } from '../../../../types/auth';
import { LogisticsOrder, LogisticsOrderBalance } from '../../../../types/logistics';
import { formatCurrency, formatDateTime } from '../transfer/utils';

type LinkedLogisticsOrdersSectionProps = {
  loading: boolean;
  error: ApiError | null;
  orders: LogisticsOrder[];
  balances: LogisticsOrderBalance[];
  onRetry: () => void;
  onCreateOrder: () => void;
  disableCreate?: boolean;
  onEditOrder?: (order: LogisticsOrder) => void;
};

const STATUS_BADGES: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  PROGRAMADA: 'bg-indigo-100 text-indigo-800',
  COMPLETADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
};

const TYPE_BADGES: Record<string, string> = {
  RETIRO: 'bg-purple-100 text-purple-800',
  ENTREGA: 'bg-blue-100 text-blue-800',
};

const formatWindow = (start?: string | null, end?: string | null) => {
  if (!start || !end) {
    return 'Ventana sin definir';
  }
  return `${formatDateTime(start)} · ${formatDateTime(end)}`;
};

const sumOrderAmount = (order: LogisticsOrder) =>
  order.items.reduce((acc, item) => acc + (item.expectedAmount || 0), 0);

export const LinkedLogisticsOrdersSection: React.FC<LinkedLogisticsOrdersSectionProps> = ({
  loading,
  error,
  orders,
  balances,
  onRetry,
  onCreateOrder,
  disableCreate = false,
  onEditOrder,
}) => {
  const navigate = useNavigate();

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-gray-500 tracking-wide">Logística vinculada</p>
          <h3 className="text-lg font-semibold text-text-primary">Órdenes logísticas</h3>
        </div>
        <button
          type="button"
          onClick={onCreateOrder}
          disabled={disableCreate}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-300"
        >
          <i className="fa-solid fa-truck-fast mr-2" />
          Crear orden logística
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        {!!balances.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {balances.map((balance) => (
              <div
                key={`balance-${balance.assetCode}-${balance.role}`}
                className="bg-gray-50 border border-gray-100 rounded-lg p-4"
              >
                <div className="text-xs text-gray-500 uppercase">{balance.assetLabel}</div>
                <div className="text-sm text-gray-500">{balance.role === 'incoming' ? 'Bien que ingresa' : 'Bien que egresa'}</div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Pendiente</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(balance.pendingAmount, balance.assetCode)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(balance.totalAmount, balance.assetCode)}</p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, ((balance.allocatedAmount || 0) / (balance.totalAmount || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Reservado {formatCurrency(balance.allocatedAmount, balance.assetCode)}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert
            type="error"
            title="No pudimos cargar las órdenes"
            message={error.message}
            onClose={onRetry}
          />
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Todavía no hay órdenes logísticas asociadas a esta operación.</p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/40 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{order.orderNumber || `OL-${order.id.slice(-6)}`}</p>
                    <p className="text-xs text-gray-500">{formatWindow(order.windowStart, order.windowEnd)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGES[order.type] || 'bg-blue-100 text-blue-800'}`}>
                        {order.type}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Monto esperado total</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(sumOrderAmount(order), order.items[0]?.assetCode || 'ARS')}
                    </p>
                    <p className="text-xs text-gray-500">Liquidación estimada {order.liquidationPercentage?.toFixed(1) ?? 0}%</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Origen</p>
                    <p className="font-medium text-text-primary">{order.origin}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Destino</p>
                    <p className="font-medium text-text-primary">{order.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Contacto</p>
                    <p className="font-medium text-text-primary">{order.contactName}</p>
                    <p className="text-xs text-gray-500">{order.contactPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Ítems</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <p key={item.id} className="flex items-center justify-between">
                          <span>
                            {item.assetType !== 'CURRENCY' && (
                              <span className="text-[10px] uppercase tracking-wide text-gray-500 mr-1">{item.assetType}</span>
                            )}
                            {item.assetCode}
                          </span>
                          <span className="font-semibold text-text-primary">
                            {formatCurrency(item.expectedAmount, item.assetCode)}
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <i className="fa-solid fa-clock mr-2" />
                    Actualizada {formatDateTime(order.updatedAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'BORRADOR' && onEditOrder && (
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="text-sm font-semibold text-gray-600 hover:text-text-primary"
                      >
                        <i className="fa-solid fa-pen-to-square mr-2" />
                        Editar borrador
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/logistica/orden/${order.id}`)}
                      className="text-primary text-sm font-medium hover:text-blue-700"
                    >
                      Ver detalle
                      <i className="fa-solid fa-arrow-right ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
