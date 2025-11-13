import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, LogisticsEvidence, TreasuryReception } from '../../../../types';
import { Alert } from '../../../ui';
import { formatCurrency, formatDateTime } from '../../operaciones/transfer/utils';
import {
  describeAssetType,
  ensureCurrencyTotals,
  receptionStatusBadgeClass,
  receptionStatusLabel,
} from './receptionUtils';

interface Props {
  reception: TreasuryReception | null;
  actionError: ApiError | null;
  runningAction: 'confirm' | 'omit' | 'revert' | null;
  onConfirm: () => void;
  onOmit: () => void;
  onRevert: () => void;
  canConfirm: boolean;
  canOmit: boolean;
  canRevert: boolean;
}

const EvidenceList: React.FC<{ evidences: LogisticsEvidence[] }> = ({ evidences }) => {
  if (!evidences.length) {
    return <p className="text-sm text-gray-500">Sin evidencias registradas.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {evidences.map((evidence) => (
        <li key={evidence.id || evidence.url} className="py-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{evidence.type}</p>
            <p className="text-xs text-gray-500">
              {evidence.metadata?.fileName || evidence.url?.split('/').pop() || 'Archivo'} ·{' '}
              {formatDateTime(evidence.createdAt)}
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

const eventLabel = (type: string) => {
  switch (type) {
    case 'recepcion.confirmada':
      return 'Recepción confirmada';
    case 'recepcion.omitida':
      return 'Recepción omitida';
    case 'recepcion.revertida':
      return 'Recepción revertida';
    case 'recepcion.pendiente':
      return 'Recepción pendiente';
    default:
      return type;
  }
};

export const ReceptionDetailPanel: React.FC<Props> = ({
  reception,
  actionError,
  runningAction,
  onConfirm,
  onOmit,
  onRevert,
  canConfirm,
  canOmit,
  canRevert,
}) => {
  const currencyTotals = useMemo(() => (reception ? ensureCurrencyTotals(reception) : []), [reception]);
  const sortedEvents = useMemo(() => {
    if (!reception?.events?.length) return [];
    return [...reception.events].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [reception]);

  if (!reception) {
    return (
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center min-h-[480px]">
        <p className="text-gray-600">
          Seleccioná una recepción para ver el detalle y confirmar u omitir el impacto en Tesorería.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">Orden logística</p>
            <h2 className="text-xl font-bold text-gray-900">{reception.orderNumber || reception.orderId}</h2>
            <p className="text-sm text-gray-500">Completada {formatDateTime(reception.completedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${receptionStatusBadgeClass(
                reception.receptionStatus
              )}`}
            >
              {receptionStatusLabel(reception.receptionStatus)}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800">
              {reception.accountingStatus === 'confirmed'
                ? 'Asiento generado'
                : reception.accountingStatus === 'omitted'
                ? 'Sin impacto contable'
                : reception.accountingStatus === 'reverted'
                ? 'Recepción revertida'
                : 'Pendiente de asiento'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 text-sm text-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase text-gray-500">Tipo</p>
            <p className="font-medium">{reception.orderType}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Courier / Mensajero</p>
            <p className="font-medium">{reception.courierName || '—'}</p>
            {reception.courierPhone && <p className="text-xs text-gray-500">{reception.courierPhone}</p>}
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Origen</p>
            <p className="font-medium">{reception.originLabel || reception.originContact?.fullName || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Destino</p>
            <p className="font-medium">{reception.destinationLabel || reception.destinationContact?.fullName || '—'}</p>
          </div>
        </div>
        {reception.orderId && (
          <Link
            to={`/dashboard/logistica/orden/${reception.orderId}`}
            className="inline-flex items-center text-xs text-primary font-semibold hover:underline"
          >
            Ver detalle de OL
            <i className="fa-solid fa-arrow-up-right-from-square ml-2" />
          </Link>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Valores recibidos</h3>
        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Ítem</th>
                <th className="px-4 py-2 text-right font-medium">Esperado</th>
                <th className="px-4 py-2 text-right font-medium">Recibido</th>
                <th className="px-4 py-2 text-right font-medium">Pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reception.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900">{item.assetCode}</p>
                    <p className="text-xs text-gray-500">{describeAssetType(item.assetType)}</p>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.expectedAmount || 0, item.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.receivedAmount || 0, item.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.pendingAmount || 0, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currencyTotals.map((total) => (
            <div key={`${reception.id}-${total.currency}`} className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs uppercase text-gray-500">{total.currency}</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(total.receivedAmount || 0, total.currency)}
              </p>
              <p className="text-xs text-gray-500">
                Esperado {formatCurrency(total.expectedAmount || 0, total.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Evidencias</h3>
        <EvidenceList evidences={reception.evidences || []} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Historial</h3>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-gray-500">Sin eventos de Tesorería registrados.</p>
        ) : (
          <ol className="space-y-3">
            {sortedEvents.map((event) => (
              <li key={event.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{eventLabel(event.type)}</p>
                  <span className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{event.user?.fullName || 'Sistema'}</p>
                {event.metadata?.reason && (
                  <p className="text-xs text-gray-600 mt-1">
                    Motivo: <span className="font-medium">{event.metadata.reason}</span>
                  </p>
                )}
                {event.metadata?.notes && (
                  <p className="text-xs text-gray-500">Notas: {event.metadata.notes}</p>
                )}
                {event.metadata?.ip && (
                  <p className="text-xs text-gray-500">IP: {event.metadata.ip}</p>
                )}
                {event.metadata?.location && (
                  <p className="text-xs text-gray-500">Ubicación: {event.metadata.location}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="space-y-3">
        {actionError && <Alert type="error" message={actionError.message || 'Acción no disponible.'} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || runningAction === 'confirm'}
            className={`px-4 py-3 rounded-lg text-sm font-semibold text-white flex items-center justify-center space-x-2 ${
              canConfirm
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {runningAction === 'confirm' && (
              <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            <span>Confirmar recepción</span>
          </button>
          <button
            type="button"
            onClick={onOmit}
            disabled={!canOmit || runningAction === 'omit'}
            className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 border ${
              canOmit
                ? 'border-amber-400 text-amber-700 hover:bg-amber-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {runningAction === 'omit' && (
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>Omitir impacto</span>
          </button>
          <button
            type="button"
            onClick={onRevert}
            disabled={!canRevert || runningAction === 'revert'}
            className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 border col-span-1 sm:col-span-2 ${
              canRevert
                ? 'border-red-400 text-red-600 hover:bg-red-50'
                : 'border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {runningAction === 'revert' && (
              <span className="inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>Revertir recepción</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Todas las acciones quedan registradas con usuario, fecha, IP y motivo para auditoría (CA9).
        </p>
      </div>
    </section>
  );
};
