import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { DashboardFooter } from '../operaciones/Footer';
import { Alert } from '../../ui/Alert';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useLogisticsOrderActions, useLogisticsOrderDetail } from '../../../hooks/dashboard/useLogisticsOrders';
import { LogisticsDiscrepancyPayload, LogisticsEvidence, LogisticsEvidenceUploadPayload, LogisticsItemsHandoverPayload, LogisticsOrder, LogisticsPartialCompletionPayload } from '../../../types/logistics';
import { formatCurrency, formatDateTime } from '../operaciones/transfer/utils';
import { HandoverWizard } from './HandoverWizard';
import { DiscrepancyModal } from './DiscrepancyModal';
import { OfflineSyncBanner } from './OfflineSyncBanner';

const STATUS_BADGES: Record<string, string> = {
  BORRADOR: 'bg-gray-100 text-gray-700',
  PROGRAMADA: 'bg-indigo-100 text-indigo-800',
  ASIGNADA: 'bg-blue-100 text-blue-800',
  EN_CAMINO: 'bg-amber-100 text-amber-900',
  EN_SITIO: 'bg-emerald-100 text-emerald-800',
  COMPLETADA: 'bg-green-100 text-green-800',
  COMPLETADA_TOTAL: 'bg-green-100 text-green-800',
  COMPLETADA_PARCIAL: 'bg-lime-100 text-lime-800',
  DISCREPANCIA: 'bg-red-100 text-red-800',
  CANCELADA: 'bg-gray-200 text-gray-500',
};

const PRIORITY_BADGES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-amber-100 text-amber-800',
  normal: 'bg-slate-100 text-slate-700',
  low: 'bg-emerald-100 text-emerald-800',
};

const requestLocation = (): Promise<{ gpsLat?: number; gpsLng?: number }> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          gpsLat: position.coords.latitude,
          gpsLng: position.coords.longitude,
        }),
      () => reject(new Error('No pudimos obtener tu ubicación. Activá el GPS y reintentá.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });

const resolveOperationPath = (order?: LogisticsOrder | null) => {
  if (!order?.operationId) {
    return null;
  }
  if (order.operationModel === 'TransferOperation') {
    return `/dashboard/operaciones/transfer-pesos/detalle/${order.operationId}`;
  }
  return `/dashboard/operaciones/detalle/${order.operationId}`;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No pudimos leer el archivo.'));
    reader.readAsDataURL(file);
  });

const serializeEvidenceFiles = async (files: FileList) =>
  Promise.all(
    Array.from(files).map(async (file) => ({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      lastModified: file.lastModified,
      dataUrl: await readFileAsDataUrl(file),
    }))
  );

const describeMetadata = (item: LogisticsOrder['items'][number]) => {
  if (item.assetType === 'CHEQUE') {
    return `${item.metadata.bank || 'Banco'} · Nº ${item.metadata.number || '—'} · ${
      item.metadata.dueDate ? formatDateTime(item.metadata.dueDate) : 'Sin fecha'
    }`;
  }
  if (item.assetType === 'METAL') {
    return `${item.metadata.metalType || 'Metal'} · ${item.metadata.purity || '—'} · ${
      item.metadata.weight || 0
    } g`;
  }
  if (item.metadata.description) {
    return item.metadata.description;
  }
  return item.notes || '—';
};

const EvidenceList: React.FC<{ evidences: LogisticsEvidence[] }> = ({ evidences }) => {
  if (!evidences.length) {
    return <p className="text-sm text-gray-500">Aún no cargaste evidencias.</p>;
  }
  return (
    <ul className="space-y-2">
      {evidences.map((evidence) => (
        <li
          key={evidence.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <div>
            <p className="font-medium text-text-primary">{evidence.type}</p>
            <p className="text-xs text-gray-500">
              {evidence.metadata?.fileName || 'Archivo adjunto'} ·{' '}
              {evidence.createdAt ? formatDateTime(evidence.createdAt) : '—'}
            </p>
          </div>
          {evidence.url && (
            <a
              href={evidence.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-xs font-semibold hover:underline"
            >
              Ver
            </a>
          )}
        </li>
      ))}
    </ul>
  );
};

export const LogisticsOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [evidenceType, setEvidenceType] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const { order, loading, error, refresh } = useLogisticsOrderDetail(orderId);
  const {
    startRoute,
    arriveOnSite,
    updateItems,
    completeTotal,
    completePartial,
    reportDiscrepancy,
    uploadEvidence,
    pendingActions,
    runningAction,
    error: actionError,
    retryPendingActions,
    clearOfflineQueue,
  } = useLogisticsOrderActions();

  const missingEvidences = useMemo(() => {
    if (!order) return [];
    const required = order.requiredEvidences || [];
    if (!required.length) return [];
    return required.filter(
      (type) => !(order.evidences || []).some((evidence) => evidence.type === type)
    );
  }, [order]);

  const timeline = order?.timeline ?? [];

  const handleStartRoute = useCallback(async () => {
    if (!orderId) return;
    await startRoute(orderId);
    await refresh();
  }, [orderId, refresh, startRoute]);

  const handleArrive = useCallback(async () => {
    if (!orderId) return;
    const coords = await requestLocation();
    await arriveOnSite(orderId, coords);
    await refresh();
  }, [arriveOnSite, orderId, refresh]);

  const handleSaveItems = async (payload: LogisticsItemsHandoverPayload) => {
    if (!orderId) return;
    await updateItems(orderId, payload);
    await refresh();
  };

  const handleCompleteTotal = async () => {
    if (!orderId) return;
    await completeTotal(orderId);
    await refresh();
  };

  const handleCompletePartial = async (payload: LogisticsPartialCompletionPayload) => {
    if (!orderId) return;
    await completePartial(orderId, payload);
    await refresh();
  };

  const handleReportDiscrepancy = async (payload: LogisticsDiscrepancyPayload) => {
    if (!orderId) return;
    const evidenceIds = (order?.evidences || [])
      .map((evidence) => evidence.id)
      .filter((id): id is string => Boolean(id));
    await reportDiscrepancy(orderId, {
      ...payload,
      evidenceIds: evidenceIds.length ? evidenceIds : undefined,
    });
    setDiscrepancyModalOpen(false);
    await refresh();
  };

  const handleUploadEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId || !evidenceType || !evidenceFiles?.length) {
      return;
    }
    setUploadingEvidence(true);
    try {
      const files = await serializeEvidenceFiles(evidenceFiles);
      const payload: LogisticsEvidenceUploadPayload = {
        type: evidenceType,
        files,
      };
      await uploadEvidence(orderId, payload);
      setEvidenceType('');
      setEvidenceFiles(null);
      setEvidenceError(null);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos cargar la evidencia.';
      setEvidenceError(message);
    } finally {
      setUploadingEvidence(false);
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

  const orderActions = useMemo(() => {
    if (!order) {
      return [];
    }
    const operationPath = resolveOperationPath(order);
    const actions: Array<{
      value: string;
      label: string;
      disabled?: boolean;
      run: () => Promise<void> | void;
    }> = [];

    if (order.status === 'BORRADOR' && operationPath) {
      actions.push({
        value: 'edit-operation',
        label: 'Completar desde operación',
        disabled: false,
        run: () => {
          navigate(operationPath);
        },
      });
    }

    if (order.status === 'PROGRAMADA' || order.status === 'ASIGNADA') {
      actions.push({
        value: 'start-route',
        label: 'Marcar en camino',
        disabled: runningAction === 'start-route',
        run: () => handleStartRoute(),
      });
    }

    if (order.status === 'EN_CAMINO') {
      actions.push({
        value: 'arrive',
        label: 'Marcar en sitio',
        disabled: runningAction === 'arrive',
        run: () => handleArrive(),
      });
    }

    return actions;
  }, [handleArrive, handleStartRoute, navigate, order, runningAction]);

  const handleActionSelect = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (!value) {
        return;
      }
      setSelectedAction(value);
      const selected = orderActions.find((action) => action.value === value);
      if (!selected || selected.disabled) {
        setSelectedAction('');
        return;
      }
      try {
        await Promise.resolve(selected.run());
      } finally {
        setSelectedAction('');
      }
    },
    [orderActions]
  );

  const canShowHandover = order?.status === 'EN_SITIO';
  const wizardSavingActions = ['update-items', 'complete-total', 'complete-partial'];
  const wizardSaving = wizardSavingActions.includes(runningAction || '');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main className="flex-1 px-4 lg:px-6 pb-10">
        <div className="max-w-6xl mx-auto pt-[400px] lg:pt-[260px] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">Orden logística</p>
              <h1 className="text-2xl font-semibold text-text-primary">{order?.orderNumber || '—'}</h1>
              {order?.operationCode && (
                <p className="text-sm text-gray-500">Operación {order.operationCode}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/logistica')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-text-primary"
              >
                Volver a logística
              </button>
              <button
                type="button"
                onClick={() => {
                  const path = resolveOperationPath(order || undefined);
                  if (path) {
                    navigate(path);
                  }
                }}
                disabled={!resolveOperationPath(order || undefined)}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-white disabled:bg-gray-300"
              >
                Ver operación
              </button>
            </div>
          </div>

          <OfflineSyncBanner
            pendingActions={pendingActions}
            onRetry={handleRetryOffline}
            onClear={clearOfflineQueue}
            syncing={syncingOffline}
            error={actionError || undefined}
          />

          {loading && (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && error && (
            <Alert
              type="error"
              title="No pudimos cargar la orden"
              message={error.message}
              onClose={refresh}
            />
          )}

          {!loading && order && (
            <div className="space-y-6">
              {actionError && <Alert type="error" message={actionError.message} />}
              {missingEvidences.length > 0 && (
                <Alert
                  type="warning"
                  message={`Faltan evidencias obligatorias: ${missingEvidences.join(', ')}`}
                />
              )}

              <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <header className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.type === 'RETIRO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.type}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        PRIORITY_BADGES[order.priority] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Prioridad {order.priority}
                    </span>
                    {order.geofenceOK && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <i className="fa-solid fa-location-dot" aria-hidden="true" />
                        Geocerca validada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Ventana {formatDateTime(order.windowStart)} · {formatDateTime(order.windowEnd)}
                  </p>
                </header>
                <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Origen</p>
                    <p className="text-base font-semibold text-text-primary">{order.origin}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Destino</p>
                    <p className="text-base font-semibold text-text-primary">{order.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Contacto</p>
                    <p className="font-semibold text-text-primary">{order.contactName}</p>
                    <p>{order.contactPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Mensajero</p>
                    <p>{order.messenger || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Asignada a</p>
                    <p>{order.assignedTo ? 'Logístico asignado' : 'Sin asignar'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {orderActions.length > 0 && (
                      <div className="flex flex-col gap-1 min-w-[220px]">
                        <label className="text-xs font-semibold text-gray-500" htmlFor="order-action-select">
                          Acciones rápidas
                        </label>
                        <div className="relative">
                          <select
                            id="order-action-select"
                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedAction}
                            onChange={handleActionSelect}
                            disabled={Boolean(runningAction) || orderActions.every((action) => action.disabled)}
                          >
                            <option value="">Seleccioná una acción</option>
                            {orderActions.map((action) => (
                              <option key={action.value} value={action.value} disabled={action.disabled}>
                                {action.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                            <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">Ítems de valor</h2>
                  {order.status.startsWith('COMPLETADA') && order.receiptUrl && (
                    <a
                      href={order.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Ver recibo #{order.receiptId || '—'}
                    </a>
                  )}
                </header>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 grid grid-cols-1 lg:grid-cols-5 gap-4 text-sm"
                    >
                      <div>
                        <p className="text-xs uppercase text-gray-500">Activo</p>
                        <p className="font-semibold text-text-primary">{item.assetCode}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Esperado</p>
                        <p className="font-semibold text-text-primary">
                          {formatCurrency(item.expectedAmount, item.assetCode)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Recibido</p>
                        <p className="font-semibold text-text-primary">
                          {item.receivedAmount !== null && item.receivedAmount !== undefined
                            ? formatCurrency(item.receivedAmount, item.assetCode)
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Pendiente</p>
                        <p className="font-semibold text-text-primary">
                          {item.pendingAmount !== null && item.pendingAmount !== undefined
                            ? formatCurrency(item.pendingAmount, item.assetCode)
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Detalle</p>
                        <p className="text-gray-600">{describeMetadata(item)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {canShowHandover && (
                <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                  <HandoverWizard
                    order={order}
                    saving={wizardSaving}
                    onSaveItems={handleSaveItems}
                    onCompleteTotal={handleCompleteTotal}
                    onCompletePartial={handleCompletePartial}
                    onReportDiscrepancy={() => setDiscrepancyModalOpen(true)}
                  />
                </section>
              )}

              <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">Evidencias</h2>
                  <p className="text-xs text-gray-500">
                    Requeridas: {order.requiredEvidences?.length || 0} · Cargadas:{' '}
                    {order.evidences.length}
                  </p>
                </header>
                <div className="grid gap-6 p-6 lg:grid-cols-2">
                  <div>
                    <EvidenceList evidences={order.evidences} />
                  </div>
                  <form onSubmit={handleUploadEvidence} className="space-y-3">
                    <label className="block text-xs uppercase text-gray-500">
                      Tipo de evidencia
                      <select
                        value={evidenceType}
                        onChange={(event) => setEvidenceType(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                        required
                      >
                        <option value="">Seleccioná un tipo</option>
                        {order.requiredEvidences?.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                        <option value="PACKAGE_PHOTO">Foto de bulto</option>
                        <option value="SIGNATURE">Firma contraparte</option>
                      </select>
                    </label>
                    <label className="block text-xs uppercase text-gray-500">
                      Archivos
                      <input
                        type="file"
                        multiple
                        onChange={(event) => setEvidenceFiles(event.target.files)}
                        className="mt-1 block w-full text-sm text-gray-600"
                        required
                      />
                    </label>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      disabled={uploadingEvidence}
                    >
                      <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
                      {uploadingEvidence ? 'Subiendo…' : 'Cargar evidencia'}
                    </button>
                    {evidenceError && (
                      <Alert
                        type="error"
                        message={evidenceError}
                        onClose={() => setEvidenceError(null)}
                      />
                    )}
                  </form>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary">Timeline</h2>
                </header>
                <div className="px-6 py-4">
                  {timeline.length === 0 && (
                    <p className="text-sm text-gray-500">Sin eventos registrados todavía.</p>
                  )}
                  <ol className="space-y-4">
                    {timeline.map((event) => (
                      <li key={event.id} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {event.title}{' '}
                            <span className="text-xs text-gray-500">
                              {event.createdAt ? formatDateTime(event.createdAt) : ''}
                            </span>
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <header className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-text-primary">Auditoría</h2>
                </header>
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Creada por</p>
                    <p>{order.createdByName || order.createdBy || '—'}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Última edición</p>
                    <p>{order.updatedByName || order.updatedBy || '—'}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />

      <DiscrepancyModal
        isOpen={discrepancyModalOpen}
        onClose={() => setDiscrepancyModalOpen(false)}
        onSubmit={handleReportDiscrepancy}
        loading={runningAction === 'report-discrepancy'}
        error={actionError || undefined}
      />
    </div>
  );
};
