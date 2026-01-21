import React, { ChangeEvent, useMemo } from 'react';
import { ApiError } from '../../../../types/auth';
import { TreasuryLinkedBalanceDetailResponse, TreasuryMovement } from '../../../../types/treasury';

interface PanelFilters {
  dateFrom: string | null;
  dateTo: string | null;
  type: 'incoming' | 'outgoing' | null;
}

interface Props {
  open: boolean;
  detail: TreasuryLinkedBalanceDetailResponse | null;
  loading: boolean;
  error: ApiError | null;
  filters: PanelFilters;
  onChangeFilters: (next: PanelFilters) => void;
  onClose: () => void;
  onViewMovement: (movement: TreasuryMovement) => void;
  onViewAllMovements: () => void;
  onRetry: () => void;
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const variationLabel = (percentage: number | null, direction: string) => {
  if (percentage === null || Number.isNaN(percentage)) {
    return '—';
  }
  if (percentage === 0) {
    return '0%';
  }
  const formatted = Math.abs(percentage).toLocaleString('es-AR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${direction === 'down' ? '-' : '+'}${formatted}%`;
};

const variationClass = (direction: string) => {
  switch (direction) {
    case 'up':
      return 'text-success';
    case 'down':
      return 'text-danger';
    default:
      return 'text-gray-500';
  }
};

const variationIcon = (direction: string) => {
  switch (direction) {
    case 'up':
      return 'fa-arrow-up';
    case 'down':
      return 'fa-arrow-down';
    default:
      return 'fa-minus';
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const mediumLabel = (medium?: string | null) => {
  switch (medium) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'deposit':
      return 'Depósito';
    default:
      return medium || '—';
  }
};

const movementTypeLabel = (type: string | null | undefined, medium?: string | null) => {
  const base = type === 'outgoing' ? 'Egreso' : 'Ingreso';
  const mediumText = mediumLabel(medium);
  return `${base} - ${mediumText}`;
};

const movementIconClass = (movement: TreasuryMovement) =>
  movement.type === 'outgoing'
    ? { wrapper: 'bg-red-100', icon: 'fa-arrow-down text-danger' }
    : { wrapper: 'bg-green-100', icon: 'fa-arrow-up text-success' };

const DetailSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[0, 1].map((index) => (
      <div
        key={`detail-skeleton-${index}`}
        className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            <div>
              <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-4 w-20 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="h-3 w-24 bg-gray-100 rounded" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const LinkedBalanceDetailPanel: React.FC<Props> = ({
  open,
  detail,
  loading,
  error,
  filters,
  onChangeFilters,
  onClose,
  onViewMovement,
  onViewAllMovements,
  onRetry,
}) => {
  const defaults = detail?.filters.defaults;
  const currentDateFrom = filters.dateFrom ?? detail?.filters.dateFrom ?? defaults?.dateFrom ?? '';
  const currentDateTo = filters.dateTo ?? detail?.filters.dateTo ?? defaults?.dateTo ?? '';
  const currentType = filters.type ?? detail?.filters.type ?? '';

  const businessTitle = useMemo(() => {
    if (!detail?.balance) return 'Detalle de cuenta';
    return `Detalle de ${detail.balance.label}`;
  }, [detail?.balance]);

  const handleDateChange =
    (field: 'dateFrom' | 'dateTo') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ? event.target.value : null;
      onChangeFilters({
        ...filters,
        [field]: value,
      });
    };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onChangeFilters({
      ...filters,
      type: value ? (value as 'incoming' | 'outgoing') : null,
    });
  };

  const panelBalance = detail?.balance;
  const variation = panelBalance?.variation;

  return (
    <aside
      className={`fixed inset-y-0 right-0 w-full sm:w-[420px] md:w-[460px] bg-white shadow-xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{businessTitle}</h3>
            <p className="text-sm text-gray-600 mt-1">Movimientos y saldo actual</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar panel de detalle"
          >
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {panelBalance && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Saldo actual</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {formatCurrency(panelBalance.amount, panelBalance.currency)}
                  </div>
                </div>
                {variation && (
                  <div className="text-right">
                    <div className={`flex items-center text-sm ${variationClass(variation.direction)}`}>
                      <i className={`fa-solid ${variationIcon(variation.direction)} mr-1`} />
                      {variationLabel(variation.percentage, variation.direction)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">vs período anterior</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-text-primary mb-3">Filtros</h4>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <input
                  type="date"
                  value={currentDateFrom}
                  onChange={handleDateChange('dateFrom')}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  type="date"
                  value={currentDateTo}
                  onChange={handleDateChange('dateTo')}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={currentType}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todos los movimientos</option>
                <option value="incoming">Solo ingresos</option>
                <option value="outgoing">Solo egresos</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-text-primary mb-3">Últimos movimientos</h4>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-3">
                <div className="flex items-center justify-between">
                  <span>{error.message || 'No pudimos cargar los movimientos.'}</span>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="text-red-600 hover:text-red-800 font-medium text-xs"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {loading && <DetailSkeleton />}

            {!loading && !error && (
              <div className="space-y-3">
                {detail?.movements?.items?.length ? (
                  detail.movements.items.map((movement, index) => {
                    const iconClasses = movementIconClass(movement);
                    const code = movement.movementCode || movement.id || '—';
                    const operationCode = movement.linkedOperations?.[0]?.code
                      ? `#${movement.linkedOperations[0].code}`
                      : '—';
                    return (
                      <div key={movement.id || movement.movementCode || `movement-card-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 ${iconClasses.wrapper} rounded-lg flex items-center justify-center mr-3`}>
                              <i className={`fa-solid ${iconClasses.icon} text-sm`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">
                                {movementTypeLabel(movement.type, movement.medium)}
                              </div>
                              <div className="text-xs text-gray-500">{formatDateTime(movement.movementAt)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-medium ${
                                movement.type === 'outgoing' ? 'text-danger' : 'text-success'
                              }`}
                            >
                              {formatCurrency(movement.amount, movement.currency || 'ARS')}
                            </div>
                            <div className="text-xs text-gray-500">#{code}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{movement.contact?.fullName || '—'}</span>
                          <span className="text-primary">{operationCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onViewMovement(movement)}
                          className="mt-3 text-primary hover:text-blue-700 text-sm"
                        >
                          Ver detalle
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-600">
                    No hay movimientos que coincidan con los filtros seleccionados.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onViewAllMovements}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver todos los movimientos
          </button>
        </div>
      </div>
    </aside>
  );
};
