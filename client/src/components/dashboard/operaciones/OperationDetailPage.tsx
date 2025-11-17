import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { DashboardFooter } from './Footer';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Alert } from '../../ui/Alert';
import { useTransactionDraft, useLogisticsOrdersByOperation } from '../../../hooks/dashboard';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { formatCurrency, formatDateTime } from './transfer/utils';
import { LogisticsOrder, TransactionAccountingEntry } from '../../../types';
import { LinkedLogisticsOrdersSection } from './logistics/LinkedLogisticsOrdersSection';
import { LogisticsOrderWizard } from '../logistica/order-wizard/LogisticsOrderWizard';

type StatusTone = {
  label: string;
  badgeClass: string;
};

const STATUS_TONES: Record<string, StatusTone> = {
  draft: { label: 'Borrador', badgeClass: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Pendiente', badgeClass: 'bg-yellow-100 text-yellow-800' },
  registered: { label: 'Registrada', badgeClass: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Liquidada', badgeClass: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', badgeClass: 'bg-gray-200 text-gray-600' },
  voided: { label: 'Anulada', badgeClass: 'bg-red-100 text-red-800' },
};

const TYPE_TONES: Record<'buy' | 'sell', StatusTone> = {
  buy: { label: 'Compra', badgeClass: 'bg-blue-100 text-blue-800' },
  sell: { label: 'Venta', badgeClass: 'bg-green-100 text-green-800' },
};

const formatPercentage = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const ACCOUNTING_ACTION_LABEL: Record<TransactionAccountingEntry['action'], string> = {
  settlement_completed: 'Liquidación registrada',
  settlement_reverted: 'Liquidación revertida',
};

export const OperationDetailPage: React.FC = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isWizardOpen, setWizardOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [editingOrder, setEditingOrder] = useState<LogisticsOrder | null>(null);

  const { draft, loading, error, fetchDraft } = useTransactionDraft(operationId);
  const {
    operation: logisticsContext,
    orders: logisticsOrders,
    balances: logisticsBalances,
    loading: logisticsLoading,
    error: logisticsError,
    refresh: refreshLogistics,
  } = useLogisticsOrdersByOperation(operationId);

  const statusTone = STATUS_TONES[draft?.status ?? 'draft'] ?? STATUS_TONES.draft;
  const typeTone = TYPE_TONES[draft?.type ?? 'buy'] ?? TYPE_TONES.buy;

  const formatAssetLabel = (asset?: { label?: string; code?: string } | null) => {
    if (!asset) {
      return '—';
    }
    const code = asset.code?.toUpperCase();
    const baseLabel = asset.label || code || '—';
    if (!code) {
      return baseLabel;
    }
    const token = `(${code})`;
    const alreadyHasCode = baseLabel.toUpperCase().includes(token);
    return alreadyHasCode ? baseLabel : `${baseLabel} (${code})`;
  };

  const incomingLabel = formatAssetLabel(draft?.incomingAsset);
  const outgoingLabel = formatAssetLabel(draft?.outgoingAsset);

  const operationRate = useMemo(() => {
    if (!draft || !draft.incomingAmount || !draft.outgoingAmount) {
      return null;
    }
    if (draft.type === 'buy') {
      return draft.outgoingAmount / draft.incomingAmount;
    }
    return draft.incomingAmount / draft.outgoingAmount;
  }, [draft]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleViewContact = () => {
    if (draft?.client?.id) {
      navigate(`/dashboard/tesoreria/saldos/contacto/${draft.client.id}`);
    }
  };

  const handleRefresh = () => {
    fetchDraft().catch(() => {});
    refreshLogistics().catch(() => {});
  };

  const handleOpenWizard = (order?: LogisticsOrder) => {
    setEditingOrder(order ?? null);
    setWizardOpen(true);
  };

  useEffect(() => {
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      fetchDraft().catch(() => {});
    });
    return unsubscribe;
  }, [fetchDraft]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const renderAccountingAudit = (entries?: TransactionAccountingEntry[]) => {
    if (!entries || !entries.length) {
      return (
        <p className="text-sm text-gray-500">
          Todavía no registramos movimientos de liquidación para esta operación.
        </p>
      );
    }

    return (
      <ul className="space-y-3">
        {entries.map((entry, index) => {
          const { action } = entry;
          const actionLabel = ACCOUNTING_ACTION_LABEL[action] ?? 'Movimiento registrado';
          const entryCurrency = entry.metadata?.currency?.toUpperCase() ?? 'ARS';
          const amount = entry.metadata?.entries
            ? entry.metadata.entries.reduce((acc, line) => acc + (line.amount || 0), 0)
            : null;
          return (
            <li
              key={`audit-entry-${index}`}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-text-primary">{actionLabel}</p>
                <span className="text-xs text-gray-500">
                  {formatDateTime(entry.performedAt ?? undefined)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Registrado por {entry.performedBy ? `usuario ${entry.performedBy}` : 'un operador'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-coins text-primary" />
                  <span>
                    {Number.isFinite(amount) ? formatCurrency(amount || 0, entryCurrency) : '—'}
                  </span>
                </div>
                {entry.metadata?.direction && (
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-exchange-alt text-primary" />
                    <span>
                      Dirección:{' '}
                      {entry.metadata.direction === 'incoming' ? 'Ingreso a tesorería' : 'Egreso desde tesorería'}
                    </span>
                  </div>
                )}
                {entry.metadata?.entries?.length ? (
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-layer-group text-primary" />
                    <span>{entry.metadata.entries.length} movimientos asociados</span>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <main className="flex-grow px-4 lg:px-6 pb-8">
        <div className="max-w-6xl mx-auto pt-[420px] lg:pt-[260px] space-y-6">
          {toast && (
            <Alert type={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'} message={toast.message} onClose={() => setToast(null)} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Detalle de operación</h1>
              {draft?.operationCode && (
                <p className="text-sm text-gray-500 mt-1">
                  Código de operación <span className="font-semibold text-text-primary">{draft.operationCode}</span>
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <i className="fa-solid fa-rotate mr-2" />
                Actualizar
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-text-primary"
              >
                <i className="fa-solid fa-arrow-left mr-2" />
                Volver a operaciones
              </button>
              <button
                type="button"
                onClick={handleViewContact}
                disabled={!draft?.client?.id}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-primary hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-id-card mr-2" />
                Ver cuenta del cliente
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && error && (
            <Alert
              type="error"
              title="No pudimos obtener la operación"
              message={error.message || 'Ocurrió un error inesperado al cargar el detalle.'}
              className="max-w-3xl"
            />
          )}

          {!loading && !draft && !error && (
            <Alert
              type="info"
              title="Operación no disponible"
              message="No encontramos la operación solicitada o ya no está disponible."
              className="max-w-3xl"
            />
          )}

          {draft && (
            <div className="space-y-6">
              <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <header className="border-b border-gray-200 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeTone.badgeClass}`}>
                      {typeTone.label}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusTone.badgeClass}`}>
                      {statusTone.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4">
                    <span>
                      Registrada: {formatDateTime(draft.createdAt)}
                    </span>
                    <span>
                      Actualizada: {formatDateTime(draft.updatedAt)}
                    </span>
                    {draft.completedAt && (
                      <span>Confirmada: {formatDateTime(draft.completedAt)}</span>
                    )}
                  </div>
                </header>

                <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                      Montos de la operación
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bien que entra</p>
                          <p className="text-sm font-semibold text-text-primary">{incomingLabel}</p>
                        </div>
                        <p className="text-lg font-semibold text-text-primary">
                          {formatCurrency(draft.incomingAmount, draft.incomingAsset.code)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bien que sale</p>
                          <p className="text-sm font-semibold text-text-primary">{outgoingLabel}</p>
                        </div>
                        <p className="text-lg font-semibold text-text-primary">
                          {formatCurrency(draft.outgoingAmount, draft.outgoingAsset.code)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase mb-1">Tipo de cambio aplicado</p>
                        <p className="text-lg font-semibold text-text-primary">
                          {formatCurrency(draft.apr, 'ARS')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Referencia mercado: {formatCurrency(draft.marketApr, 'ARS')}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase mb-1">Margen</p>
                        <p className="text-lg font-semibold text-text-primary">
                          {formatPercentage(draft.marginPercentage)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          TC efectivo: {operationRate ? formatCurrency(operationRate, 'ARS') : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                      Información del cliente
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                      <p className="font-semibold text-text-primary text-base">
                        {draft.client?.fullName || 'Cliente sin nombre definido'}
                      </p>
                      {draft.client?.cuit && (
                        <p>
                          <span className="text-gray-500">CUIT/CUIL:</span> {draft.client.cuit}
                        </p>
                      )}
                      {draft.client?.contactType && (
                        <p>
                          <span className="text-gray-500">Tipo de contacto:</span>{' '}
                          {draft.client.contactType === 'client' ? 'Cliente' : draft.client.contactType}
                        </p>
                      )}
                      {draft.client?.email && (
                        <p>
                          <span className="text-gray-500">Email:</span> {draft.client.email}
                        </p>
                      )}
                      {draft.client?.phone && (
                        <p>
                          <span className="text-gray-500">Teléfono:</span> {draft.client.phone}
                        </p>
                      )}
                      {draft.client?.internalOwner && (
                        <p>
                          <span className="text-gray-500">Owner interno:</span> {draft.client.internalOwner}
                        </p>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase mb-1">Modalidad de liquidación</p>
                        <p className="text-sm font-semibold text-text-primary">
                          {draft.settlement.mode === 'compound' ? 'Compuesta' : 'Simple'}
                        </p>
                      </div>
                      {draft.settlement.mode === 'simple' && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase mb-1">Método seleccionado</p>
                          <p className="text-sm text-gray-700">
                            {draft.settlement.simpleMethod || 'Sin método asignado'}
                          </p>
                        </div>
                      )}
                      {draft.settlement.mode === 'compound' && draft.settlement.lines.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 uppercase mb-1">Distribución</p>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {draft.settlement.lines.map((line, index) => (
                              <li key={`settlement-line-${index}`} className="flex items-center justify-between">
                                <span>{line.method}</span>
                                <span>
                                  {line.allocationType === 'percentage'
                                    ? `${line.value}%`
                                    : formatCurrency(line.value, 'ARS')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-6">
                <header className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Movimientos contables
                  </h2>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary hover:text-blue-700 rounded-lg"
                  >
                    <i className="fa-solid fa-refresh mr-2" />
                    Actualizar registro
                  </button>
                </header>
                {renderAccountingAudit(draft.accountingAudit)}
              </section>

              <LinkedLogisticsOrdersSection
                loading={logisticsLoading}
                error={logisticsError}
                orders={logisticsOrders}
                balances={logisticsBalances}
                onRetry={refreshLogistics}
                onCreateOrder={() => handleOpenWizard()}
                onEditOrder={(order) => handleOpenWizard(order)}
                disableCreate={!logisticsContext}
              />
            </div>
          )}
        </div>
      </main>

      <DashboardFooter />

      <LogisticsOrderWizard
        isOpen={isWizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingOrder(null);
        }}
        operation={logisticsContext}
        balances={logisticsBalances}
        editingOrder={editingOrder}
        onCompleted={(newOrder, status) => {
          setToast({
            type: status === 'PROGRAMADA' ? 'success' : 'info',
            message:
              status === 'PROGRAMADA'
                ? `Orden ${newOrder.orderNumber} programada correctamente.`
                : `Borrador ${newOrder.orderNumber} guardado.`,
          });
          refreshLogistics();
          setEditingOrder(null);
        }}
      />
    </div>
  );
};
