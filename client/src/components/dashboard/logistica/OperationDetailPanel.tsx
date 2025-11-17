import React from 'react';
import { LogisticsOperation } from '../../../types/logistics';

interface OperationDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  operation: LogisticsOperation | null;
  onEditOperation: () => void;
  onMarkAsCompleted: () => void;
  onCancelOperation: () => void;
  onRestoreOperation?: () => void;
  pendingAction?: 'complete' | 'cancel' | 'restore' | null;
}

const formatAmount = (amount: number | null, currency: string) => {
  if (amount === null || Number.isNaN(amount)) {
    return '—';
  }
  
  const normalizedCurrency = currency?.toUpperCase() || 'ARS';
  
  return new Intl.NumberFormat(normalizedCurrency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const TIMELINE_STATE_CLASSES: Record<string, string> = {
  completed: 'bg-primary text-white',
  current: 'bg-yellow-100 text-yellow-700',
  upcoming: 'bg-gray-200 text-gray-500',
};

export const OperationDetailPanel: React.FC<OperationDetailPanelProps> = ({
  isOpen,
  onClose,
  operation,
  onEditOperation,
  onMarkAsCompleted,
  onCancelOperation,
  onRestoreOperation,
  pendingAction = null,
}) => {
  if (!isOpen || !operation) {
    return null;
  }

  const isArchived = Boolean(operation.archived);
  const canComplete = !isArchived && !['completado', 'anulado'].includes(operation.status);
  const canCancel = !isArchived && operation.status !== 'anulado';
  const isCompleting = pendingAction === 'complete';
  const isCancelling = pendingAction === 'cancel';
  const isRestoring = pendingAction === 'restore';

  const statusBadge = (() => {
    switch (operation.status) {
      case 'en-curso':
        return 'bg-yellow-100 text-yellow-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  })();

  const typeBadge = (() => {
    switch (operation.type) {
      case 'transferencia':
      case 'transferencia-interna':
        return 'bg-green-100 text-green-800';
      case 'retiro':
        return 'bg-purple-100 text-purple-800';
      case 'custodia':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  })();

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black bg-opacity-40" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-[420px] bg-white shadow-xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <span className="text-xs uppercase text-gray-500 tracking-wide">Detalle de operación</span>
            <h3 className="text-lg font-semibold text-text-primary">#{operation.id}</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadge}`}>
                {operation.type === 'transferencia-interna' ? 'Transferencia interna' : operation.type.charAt(0).toUpperCase() + operation.type.slice(1)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
                {operation.status === 'en-curso' ? 'En curso' : operation.status === 'completado' ? 'Completado' : 'Pendiente'}
              </span>
              {isArchived && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                  Archivada
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <section>
            <h4 className="text-sm font-medium text-text-primary mb-3">Resumen</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Monto</span>
                <span className="text-base font-semibold text-text-primary">
                  {formatAmount(operation.amount, operation.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Responsable</span>
                <span className="text-sm font-medium text-text-primary">{operation.responsible}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Fecha de registro</span>
                <span className="text-sm font-medium text-text-primary">{formatDateTime(operation.date)}</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-medium text-text-primary mb-3">Contacto y recorrido</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <i className="fa-solid fa-user me-2 text-gray-400" />
                <span>{operation.contact}</span>
              </div>
              <div className="flex items-start">
                <i className="fa-solid fa-route me-2 text-gray-400 mt-0.5" />
                <span>{operation.route}</span>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-sm font-medium text-text-primary mb-3">Detalle</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{operation.notes}</p>
          </section>

          <section>
            <h4 className="text-sm font-medium text-text-primary mb-3">Seguimiento</h4>
            <div className="space-y-4">
              {operation.timeline.map((step, index) => {
                const badgeTone = TIMELINE_STATE_CLASSES[step.state] ?? TIMELINE_STATE_CLASSES.upcoming;
                const lineClass = index === operation.timeline.length - 1 ? 'hidden' : 'block';

                return (
                  <div key={step.id} className="relative pl-10">
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${badgeTone}`}>
                      {step.state === 'completed' && <i className="fa-solid fa-check text-xs" />}
                      {step.state === 'current' && <i className="fa-solid fa-location-arrow text-xs" />}
                      {step.state === 'upcoming' && <i className="fa-solid fa-circle text-[10px]" />}
                    </div>
                    <div className={`absolute left-[14px] top-8 w-[2px] h-10 bg-gray-200 ${lineClass}`} />
                    <div>
                      <div className="text-sm font-medium text-text-primary">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatDateTime(step.date)} · {step.user}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {!!operation.attachments.length && (
            <section>
              <h4 className="text-sm font-medium text-text-primary mb-3">Adjuntos</h4>
              <div className="space-y-2">
                {operation.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center">
                      <i
                        className={`fa-solid ${attachment.type === 'pdf' ? 'fa-file-pdf text-red-500' : 'fa-image text-blue-500'} mr-3`}
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">{attachment.name}</div>
                        <div className="text-xs text-gray-500">{attachment.size}</div>
                      </div>
                    </div>
                    <button type="button" className="text-primary hover:text-blue-700 text-sm">
                      Ver archivo
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {isArchived && (
          <div className="px-6 py-4 border-t border-gray-200 bg-yellow-50 text-sm text-yellow-900">
            Esta operación está archivada. Restaurala para volver a gestionarla desde el panel.
          </div>
        )}

        <div className="px-6 py-5 border-t border-gray-200 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEditOperation}
            disabled={isArchived}
            className="flex-1 py-2 px-4 border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isArchived ? 'Editar no disponible' : 'Editar operación'}
          </button>
          <button
            type="button"
            onClick={onMarkAsCompleted}
            disabled={!canComplete || isCompleting || isCancelling}
            className={`flex-1 py-2 px-4 rounded-lg text-white transition-colors ${
              !canComplete || isCompleting || isCancelling
                ? 'bg-green-200 cursor-not-allowed'
                : 'bg-success hover:bg-green-600'
            }`}
          >
            {isCompleting ? 'Procesando…' : 'Marcar completada'}
          </button>
          <button
            type="button"
            onClick={onCancelOperation}
            disabled={!canCancel || isCancelling}
            className={`flex-1 py-2 px-4 rounded-lg text-white transition-colors ${
              !canCancel || isCancelling ? 'bg-red-200 cursor-not-allowed' : 'bg-danger hover:bg-red-600'
            }`}
          >
            {isCancelling ? 'Anulando…' : 'Anular movimiento'}
          </button>
        </div>

        {isArchived && onRestoreOperation && (
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={onRestoreOperation}
              disabled={isRestoring}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isRestoring ? 'Restaurando…' : 'Restaurar operación'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default OperationDetailPanel;
