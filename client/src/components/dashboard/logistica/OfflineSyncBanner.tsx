import React from 'react';
import { ApiError, LogisticsOfflineAction } from '../../../types';

interface OfflineSyncBannerProps {
  pendingActions: LogisticsOfflineAction[];
  onRetry: () => Promise<void>;
  onClear: () => void;
  syncing?: boolean;
  error?: ApiError | null;
}

const ACTION_LABELS: Record<string, string> = {
  'start-route': 'Iniciar recorrido',
  arrive: 'Marcar en sitio',
  'update-items': 'Actualizar conteo',
  'complete-total': 'Completar total',
  'complete-partial': 'Completar parcial',
  'report-discrepancy': 'Reportar discrepancia',
  'add-evidence': 'Cargar evidencias',
};

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  pendingActions,
  onRetry,
  onClear,
  syncing = false,
  error,
}) => {
  if (!pendingActions.length) {
    return null;
  }

  const handleRetry = async () => {
    await onRetry();
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
            <i className="fa-solid fa-wave-square" aria-hidden="true" />
            {pendingActions.length} acción{pendingActions.length === 1 ? '' : 'es'} pendientes de sincronizar
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Se guardaron localmente por falta de conexión. Reintentá cuando tengas señal estable.
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1" role="alert">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
            disabled={syncing}
          >
            <i className="fa-solid fa-rotate" aria-hidden="true" />
            {syncing ? 'Sincronizando…' : 'Reintentar sync'}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm text-amber-700 hover:text-amber-900"
            disabled={syncing}
          >
            <i className="fa-solid fa-trash-can" aria-hidden="true" />
            Descartar
          </button>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-amber-800">
        {pendingActions.slice(0, 3).map((action) => (
          <li key={action.id} className="flex items-center gap-2">
            <i className="fa-solid fa-circle-dot text-[10px]" aria-hidden="true" />
            {ACTION_LABELS[action.type] || action.type} · OL {action.orderId}
          </li>
        ))}
        {pendingActions.length > 3 && (
          <li className="italic text-amber-700">
            + {pendingActions.length - 3} pendiente{pendingActions.length - 3 === 1 ? '' : 's'} más
          </li>
        )}
      </ul>
    </div>
  );
};

