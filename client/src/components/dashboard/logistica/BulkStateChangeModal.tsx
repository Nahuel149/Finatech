import React from 'react';
import { LogisticsOperation } from '../../../types/logistics';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import { Alert } from '../../ui/Alert';

interface BulkStateChangeModalProps {
  isOpen: boolean;
  action: 'complete' | 'cancel' | 'archive' | 'restore';
  operations: LogisticsOperation[];
  loading: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ACTION_COPY = {
  complete: {
    title: 'Marcar operaciones como completadas',
    accentClass: 'text-green-600',
    iconClass: 'fa-circle-check',
    description:
      'Confirmá que los movimientos seleccionados ya finalizaron y deben aparecer como completados en el panel.',
    confirmLabel: 'Marcar como completadas',
  },
  cancel: {
    title: 'Anular operaciones seleccionadas',
    accentClass: 'text-danger',
    iconClass: 'fa-ban',
    description:
      'Estas operaciones se marcarán como anuladas y dejarán de estar disponibles para acciones futuras.',
    confirmLabel: 'Anular movimientos',
  },
  archive: {
    title: 'Archivar operaciones seleccionadas',
    accentClass: 'text-indigo-600',
    iconClass: 'fa-box-archive',
    description:
      'Los movimientos archivados dejarán de mostrarse en el panel, pero podrás recuperarlos más adelante desde la base de datos.',
    confirmLabel: 'Archivar operaciones',
  },
  restore: {
    title: 'Restaurar operaciones archivadas',
    accentClass: 'text-primary',
    iconClass: 'fa-rotate-left',
    description:
      'Las operaciones volverán a mostrarse junto al resto de los movimientos activos.',
    confirmLabel: 'Restaurar operaciones',
  },
} as const;

export const BulkStateChangeModal: React.FC<BulkStateChangeModalProps> = ({
  isOpen,
  action,
  operations,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) {
    return null;
  }

  const copy = ACTION_COPY[action];
  const preview = operations.slice(0, 4);
  const remaining = Math.max(0, operations.length - preview.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${copy.accentClass}`}>
              Acciones masivas
            </p>
            <h2 className="text-lg font-semibold text-text-primary">{copy.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Cerrar"
            disabled={loading}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="px-6 py-5 space-y-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ${copy.accentClass}`}>
                <i className={`fa-solid ${copy.iconClass}`} />
              </span>
              <div>
                <p className="text-sm text-gray-500">Operaciones seleccionadas</p>
                <p className="text-xl font-semibold text-text-primary">{operations.length}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">{copy.description}</p>
            {preview.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {preview.map((operation) => (
                  <li key={operation.id} className="flex items-center gap-2">
                    <i className="fa-solid fa-hashtag text-gray-400" />
                    {operation.operationCode}
                  </li>
                ))}
                {remaining > 0 && <li className="text-xs text-gray-500">+ {remaining} operaciones más</li>}
              </ul>
            )}
          </div>

          {errorMessage && <Alert type="error" message={errorMessage} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                action === 'complete'
                  ? 'bg-green-600 hover:bg-green-700'
                  : action === 'cancel'
                  ? 'bg-danger hover:bg-red-600'
                  : action === 'archive'
                  ? 'bg-gray-800 hover:bg-gray-900'
                  : 'bg-primary hover:bg-blue-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Aplicando…' : copy.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStateChangeModal;
