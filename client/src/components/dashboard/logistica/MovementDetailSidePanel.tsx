import React, { useMemo } from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
} from '../../icons/HeroiconsOutline';

interface MovementDetailSidePanelProps {
  isOpen: boolean;
  movement: any;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsCompleted: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onRegisterIncident: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; iconClass: string }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    iconClass: 'fa-regular fa-clock',
  },
  'en-progreso': {
    label: 'En curso',
    badgeClass: 'bg-blue-100 text-blue-800',
    iconClass: 'fa-solid fa-clock',
  },
  encurso: {
    label: 'En curso',
    badgeClass: 'bg-blue-100 text-blue-800',
    iconClass: 'fa-solid fa-clock',
  },
  completado: {
    label: 'Completado',
    badgeClass: 'bg-success text-white',
    iconClass: 'fa-solid fa-check',
  },
  anulado: {
    label: 'Anulado',
    badgeClass: 'bg-danger text-white',
    iconClass: 'fa-solid fa-circle-xmark',
  },
};

const getStatusDisplay = (status?: string) => {
  if (!status) {
    return STATUS_CONFIG.pendiente;
  }
  const normalized = status.toLowerCase();
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.pendiente;
};

const movementTypeIcon = (type?: string) => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('entrega')) return 'fa-truck';
  if (normalized.includes('transfer')) return 'fa-right-left';
  if (normalized.includes('retiro')) return 'fa-arrow-up';
  if (normalized.includes('custodia')) return 'fa-shield';
  return 'fa-box';
};

const timelineIconClass = (eventType?: string) => {
  switch (eventType) {
    case 'created':
      return 'fa-solid fa-plus text-white';
    case 'started':
    case 'updated':
      return 'fa-solid fa-play text-white';
    case 'received':
      return 'fa-solid fa-check text-white';
    case 'completed':
      return 'fa-solid fa-flag text-white';
    default:
      return 'fa-regular fa-circle text-white';
  }
};

const timelineColor = (eventType?: string, isCompleted?: boolean) => {
  if (isCompleted) {
    return 'bg-success';
  }
  switch (eventType) {
    case 'created':
      return 'bg-success';
    case 'updated':
    case 'started':
      return 'bg-primary';
    default:
      return 'bg-gray-300';
  }
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (typeof amount !== 'number') return '—';
  const code = currency === 'USD' ? 'USD' : 'ARS';
  return new Intl.NumberFormat(code === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const MovementDetailSidePanel: React.FC<MovementDetailSidePanelProps> = ({
  isOpen,
  movement,
  isLoading,
  onClose,
  onMarkAsCompleted,
  onEdit,
  onCancel,
  onRegisterIncident,
}) => {
  const statusDisplay = useMemo(
    () => getStatusDisplay(movement?.status),
    [movement?.status]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50"
        role="presentation"
        onClick={onClose}
      />

      <aside
        className="absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[460px] lg:w-[520px]"
        role="dialog"
        aria-modal="true"
      >
        <header className="border-b border-gray-200 bg-gray-50 px-6 py-6">
          <nav
            className="mb-3 flex items-center space-x-2 text-sm text-gray-600"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              onClick={onClose}
              className="text-primary font-medium hover:underline"
            >
              Logística
            </button>
            <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
            <span>{movement?.id || 'Movimiento'}</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Detalle del movimiento
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Consulta la información operativa y el estado completo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Cerrar panel"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <i
                      className={`fa-solid ${movementTypeIcon(movement?.type)} text-primary text-lg`}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      {movement?.id || '—'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {movement?.type || 'Sin tipo definido'}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusDisplay.badgeClass}`}
                >
                  <i className={`${statusDisplay.iconClass} mr-2`} aria-hidden="true" />
                  {statusDisplay.label}
                </span>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Fecha y hora</dt>
                  <dd className="font-medium text-text-primary">
                    {formatDate(movement?.date)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Responsable</dt>
                  <dd className="font-medium text-text-primary">
                    {movement?.responsible || '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Contacto</dt>
                  <dd className="font-medium text-text-primary">
                    {movement?.contact || '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Referencia</dt>
                  <dd className="text-text-primary">
                    {movement?.reference || '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Última actualización</dt>
                  <dd className="text-gray-500">
                    {formatDate(movement?.audit?.lastModifiedAt)}
                  </dd>
                </div>
              </dl>

              {movement?.status &&
                !['completado', 'anulado'].includes(
                  movement.status.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={onMarkAsCompleted}
                    className="mt-4 w-full rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                  >
                    <i className="fa-solid fa-check mr-2" aria-hidden="true" />
                    Marcar como completado
                  </button>
                )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">
                Timeline de estados
              </h3>
              <div className="space-y-4">
                {(movement?.timeline || []).map((event: any) => {
                  const isCompleted =
                    event.type === 'completed' || event.type === 'received';
                  return (
                    <div key={event.id} className="timeline-item flex items-start">
                      <div
                        className={`mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${timelineColor(
                          event.type,
                          isCompleted
                        )}`}
                      >
                        <i
                          className={`${timelineIconClass(event.type)} text-sm`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(event.date)}
                          {event.user ? ` • ${event.user}` : null}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-xs text-gray-500">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!movement?.timeline?.length && (
                  <p className="text-sm text-gray-500">
                    Aún no hay eventos registrados en la cronología.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">
                Detalle operativo
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Origen</span>
                  <span className="font-medium text-text-primary">
                    {movement?.origin || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Destino</span>
                  <span className="font-medium text-text-primary">
                    {movement?.destination || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Medio</span>
                  <span className="font-medium text-text-primary">
                    {movement?.medium || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Moneda</span>
                  <span className="font-medium text-text-primary">
                    {movement?.currency || '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Monto total</span>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(movement?.totalAmount, movement?.currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-gray-600">Operación vinculada</span>
                  <span className="font-medium text-primary">
                    {movement?.linkedOperation || '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                  <i className="fa-solid fa-info-circle mr-2" aria-hidden="true" />
                  Sin impacto contable directo
                </span>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  Ítems asociados
                </h3>
                <button
                  type="button"
                  onClick={onRegisterIncident}
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-blue-700"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Registrar incidencia
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Identificador</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {(movement?.associatedItems || []).map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-text-primary">{item.description}</td>
                        <td className="px-4 py-3 text-gray-600">{item.identifier}</td>
                        <td className="px-4 py-3 text-text-primary">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="mr-3 text-primary transition-colors hover:text-blue-700"
                            aria-label="Ver ítem"
                          >
                            <EyeIcon className="inline h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-400 transition-colors hover:text-gray-600"
                            aria-label="Editar ítem"
                          >
                            <PencilIcon className="inline h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!movement?.associatedItems?.length && (
                <p className="mt-3 text-sm text-gray-500">
                  No hay ítems asociados todavía.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">
                Documentos adjuntos
              </h3>
              <div className="space-y-3">
                {(movement?.attachments || []).map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-6 w-6 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.type} • {attachment.size}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:text-blue-700"
                    >
                      Ver
                    </button>
                  </div>
                ))}
              </div>
              {!movement?.attachments?.length && (
                <p className="text-sm text-gray-500">
                  No hay documentos adjuntos disponibles.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-text-primary">
                Auditoría y registro
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Creado por</span>
                  <span className="text-text-primary">
                    {movement?.audit?.createdBy || '—'} •{' '}
                    {formatDate(movement?.audit?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">Última modificación</span>
                  <span className="text-text-primary">
                    {movement?.audit?.lastModifiedBy || '—'} •{' '}
                    {formatDate(movement?.audit?.lastModifiedAt)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">IP de registro</span>
                  <span className="text-gray-500">{movement?.audit?.ipAddress || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Log de cambios</span>
                  <span className="text-gray-400">No disponible</span>
                </div>
              </div>
            </section>
          </div>
        )}

        <footer className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-200"
            >
              <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true" />
              Volver a Logística
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-100"
              >
                Editar movimiento
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-red-50"
              >
                Anular movimiento
              </button>
              {movement?.status &&
                !['completado', 'anulado'].includes(
                  movement.status.toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={onMarkAsCompleted}
                    className="inline-flex items-center justify-center rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                  >
                    Marcar como completado
                  </button>
                )}
            </div>
          </div>
        </footer>
      </aside>
    </div>
  );
};
