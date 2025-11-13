import React from 'react';
import { ApiError, TreasuryReception } from '../../../../types';
import { formatCurrency, formatDateTime } from '../../operaciones/transfer/utils';
import {
  ensureCurrencyTotals,
  receptionStatusBadgeClass,
  receptionStatusLabel,
  summarizeAssetTypes,
} from './receptionUtils';

interface Props {
  items: TreasuryReception[];
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSelect: (reception: TreasuryReception) => void;
  selectedId: string | null;
}

const typeBadgeClass = (type?: string) => {
  if (type === 'RETIRO') return 'bg-emerald-100 text-emerald-800';
  if (type === 'ENTREGA') return 'bg-amber-100 text-amber-900';
  return 'bg-gray-100 text-gray-700';
};

const ContactSummary: React.FC<{ reception: TreasuryReception }> = ({ reception }) => {
  if (reception.originLabel || reception.destinationLabel) {
    return (
      <div>
        {reception.originLabel && (
          <p className="text-sm text-gray-900">
            Origen: <span className="font-medium">{reception.originLabel}</span>
          </p>
        )}
        {reception.destinationLabel && (
          <p className="text-sm text-gray-900">
            Destino: <span className="font-medium">{reception.destinationLabel}</span>
          </p>
        )}
      </div>
    );
  }
  if (reception.originContact?.fullName || reception.destinationContact?.fullName) {
    return (
      <div>
        {reception.originContact?.fullName && (
          <p className="text-sm text-gray-900">
            Origen: <span className="font-medium">{reception.originContact.fullName}</span>
          </p>
        )}
        {reception.destinationContact?.fullName && (
          <p className="text-sm text-gray-900">
            Destino: <span className="font-medium">{reception.destinationContact.fullName}</span>
          </p>
        )}
      </div>
    );
  }
  return <p className="text-sm text-gray-500">Sin contactos asociados.</p>;
};

export const PendingReceptionsTable: React.FC<Props> = ({
  items,
  loading,
  error,
  onRetry,
  pagination,
  onPageChange,
  onSelect,
  selectedId,
}) => {
  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const hasItems = items.length > 0;
  const rangeStart = hasItems ? Math.max(1, (pagination.page - 1) * pagination.limit + 1) : 0;
  const rangeEnd = hasItems
    ? Math.min(pagination.page * pagination.limit, pagination.totalItems)
    : 0;
  const pageNumbers: number[] = [];
  const maxButtons = 5;
  const startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  for (let page = startPage; page <= endPage; page += 1) {
    pageNumbers.push(page);
  }

  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-10 text-center">
            <div className="flex flex-col items-center space-y-3 text-gray-500">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando recepciones pendientes…</span>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <p className="text-sm text-danger">{error.message || 'No pudimos cargar las recepciones.'}</p>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
              >
                Reintentar
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (!items.length) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
            No hay recepciones para los filtros seleccionados.
          </td>
        </tr>
      );
    }

    return items.map((reception) => {
      const totals = ensureCurrencyTotals(reception);
      const isSelected = selectedId === reception.id;
      return (
        <tr
          key={reception.id}
          className={`cursor-pointer transition-colors ${
            isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelect(reception)}
        >
          <td className="px-6 py-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{reception.orderNumber || 'OL'}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass(reception.orderType)}`}>
                  {reception.orderType || '–'}
                </span>
              </div>
              <p className="text-xs text-gray-500">Completa {formatDateTime(reception.completedAt)}</p>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="text-sm font-medium text-gray-900">{reception.courierName || '—'}</div>
            {reception.courierPhone && (
              <div className="text-xs text-gray-500">{reception.courierPhone}</div>
            )}
          </td>
          <td className="px-6 py-4">
            <ContactSummary reception={reception} />
          </td>
          <td className="px-6 py-4">
            <div className="space-y-2">
              {totals.map((total) => (
                <div key={`${reception.id}-${total.currency}`} className="flex flex-col text-sm">
                  <div className="font-medium text-gray-900">{total.currency}</div>
                  <div className="text-xs text-gray-500">
                    Recibido {formatCurrency(total.receivedAmount || 0, total.currency)} / Esperado{' '}
                    {formatCurrency(total.expectedAmount || 0, total.currency)}
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">{summarizeAssetTypes(reception)}</p>
            </div>
          </td>
          <td className="px-6 py-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${receptionStatusBadgeClass(
                reception.receptionStatus
              )}`}
            >
              {receptionStatusLabel(reception.receptionStatus)}
            </span>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="text-xs text-gray-500">
              Página {pagination.page} · {items.length} resultados
            </div>
            <button
              type="button"
              className="text-primary text-sm font-medium hover:underline"
              onClick={() => onSelect(reception)}
            >
              Ver detalle
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Recepciones pendientes</h2>
          <p className="text-sm text-gray-500">
            Recepciones asociadas a órdenes logísticas completadas y pendientes de Tesorería
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Página {pagination.page} de {totalPages}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orden logística
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Courier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contactos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valores
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado recepción
              </th>
              <th scope="col" className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">{renderBody()}</tbody>
        </table>
      </div>

      <footer className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-sm text-gray-500">
          {hasItems
            ? `Mostrando ${rangeStart}-${rangeEnd} de ${pagination.totalItems} recepciones`
            : 'Sin recepciones para mostrar'}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                pagination.page === page
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages || loading}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </footer>
    </section>
  );
};
