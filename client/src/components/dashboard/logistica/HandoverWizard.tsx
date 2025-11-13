import React, { useEffect, useMemo, useState } from 'react';
import {
  LogisticsItemsHandoverPayload,
  LogisticsOrder,
  LogisticsOrderItem,
  LogisticsPartialCompletionPayload,
} from '../../../types';
import { Alert } from '../../ui/Alert';
import { formatCurrency } from '../operaciones/transfer/utils';

type ItemDraft = {
  id: string;
  assetCode: string;
  assetType: LogisticsOrderItem['assetType'];
  expectedAmount: number;
  metadata: LogisticsOrderItem['metadata'];
  notes?: string | null;
  receivedAmount: string;
  pendingAmount: string;
  discrepancyFlag: boolean;
  discrepancyReason: string;
};

const formatNumber = (value: string) => {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

interface HandoverWizardProps {
  order: LogisticsOrder;
  saving?: boolean;
  onSaveItems: (payload: LogisticsItemsHandoverPayload) => Promise<void>;
  onCompleteTotal: () => Promise<void>;
  onCompletePartial: (payload: LogisticsPartialCompletionPayload) => Promise<void>;
  onReportDiscrepancy: () => void;
}

export const HandoverWizard: React.FC<HandoverWizardProps> = ({
  order,
  saving = false,
  onSaveItems,
  onCompleteTotal,
  onCompletePartial,
  onReportDiscrepancy,
}) => {
  const [drafts, setDrafts] = useState<ItemDraft[]>([]);
  const [localMessage, setLocalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!order?.items?.length) {
      setDrafts([]);
      return;
    }
    setDrafts(
      order.items.map((item) => ({
        id: item.id || '',
        assetCode: item.assetCode,
        assetType: item.assetType,
        expectedAmount: item.expectedAmount,
        metadata: item.metadata || {},
        notes: item.notes,
        receivedAmount:
          item.receivedAmount !== null && item.receivedAmount !== undefined
            ? String(item.receivedAmount)
            : '',
        pendingAmount:
          item.pendingAmount !== null && item.pendingAmount !== undefined
            ? String(item.pendingAmount)
            : '',
        discrepancyFlag: Boolean(item.discrepancyFlag),
        discrepancyReason: item.discrepancyReason || '',
      }))
    );
  }, [order]);

  const totals = useMemo(() => {
    return drafts.reduce(
      (acc, item) => {
        const expected = item.expectedAmount;
        const received = Number(item.receivedAmount) || 0;
        acc.expected += expected;
        acc.received += received;
        return acc;
      },
      { expected: 0, received: 0 }
    );
  }, [drafts]);

  const setDraftValue = (itemId: string, field: keyof ItemDraft, value: string | boolean) => {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== itemId) {
          return draft;
        }
        return {
          ...draft,
          [field]: value,
        };
      })
    );
  };

  const setMetadataValue = (itemId: string, field: keyof LogisticsOrderItem['metadata'], value: string) => {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== itemId) {
          return draft;
        }
        return {
          ...draft,
          metadata: {
            ...draft.metadata,
            [field]: value,
          },
        };
      })
    );
  };

  const handleSave = async () => {
    const payload: LogisticsItemsHandoverPayload = {
      items: drafts.map((draft) => ({
        id: draft.id,
        receivedAmount: formatNumber(draft.receivedAmount),
        pendingAmount: formatNumber(draft.pendingAmount),
        discrepancyFlag: draft.discrepancyFlag,
        discrepancyReason: draft.discrepancyReason || undefined,
        metadata: draft.metadata,
      })),
    };

    const hasChanges = payload.items.some(
      (item) =>
        item.receivedAmount !== undefined ||
        item.pendingAmount !== undefined ||
        item.discrepancyFlag ||
        (item.discrepancyReason && item.discrepancyReason.length) ||
        (item.metadata && Object.keys(item.metadata).length)
    );

    if (!hasChanges) {
      setLocalMessage({ type: 'error', text: 'No registraste cambios en los ítems.' });
      return;
    }

    setLocalMessage(null);
    await onSaveItems(payload);
    setLocalMessage({ type: 'success', text: 'Conteo actualizado correctamente.' });
  };

  const handlePartialCompletion = async () => {
    const items = drafts
      .map((draft) => ({
        id: draft.id,
        pendingAmount: formatNumber(draft.pendingAmount) ?? 0,
        receivedAmount: formatNumber(draft.receivedAmount) ?? 0,
        note: draft.discrepancyReason || undefined,
      }))
      .filter((item) => (item.pendingAmount || 0) > 0);

    if (!items.length) {
      setLocalMessage({
        type: 'error',
        text: 'Indicá qué valores quedaron pendientes antes de completar parcial.',
      });
      return;
    }

    await onCompletePartial({ items });
  };

  const renderMetadataFields = (item: ItemDraft) => {
    if (item.assetType === 'CHEQUE') {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs uppercase text-gray-500">
            Banco
            <input
              type="text"
              value={item.metadata.bank || ''}
              onChange={(event) => setMetadataValue(item.id, 'bank', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              placeholder="Banco"
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Número
            <input
              type="text"
              value={item.metadata.number || ''}
              onChange={(event) => setMetadataValue(item.id, 'number', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              placeholder="00000000"
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Fecha
            <input
              type="date"
              value={item.metadata.dueDate ? item.metadata.dueDate.slice(0, 10) : ''}
              onChange={(event) => setMetadataValue(item.id, 'dueDate', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
            />
          </label>
        </div>
      );
    }

    if (item.assetType === 'METAL') {
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs uppercase text-gray-500">
            Metal
            <input
              type="text"
              value={item.metadata.metalType || ''}
              onChange={(event) => setMetadataValue(item.id, 'metalType', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              placeholder="Oro, Plata..."
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Pureza
            <input
              type="text"
              value={item.metadata.purity || ''}
              onChange={(event) => setMetadataValue(item.id, 'purity', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              placeholder="99.9%"
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Peso
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.metadata.weight ?? ''}
              onChange={(event) => setMetadataValue(item.id, 'weight', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
              placeholder="0.00"
            />
          </label>
        </div>
      );
    }

    return (
      <label className="text-xs uppercase text-gray-500">
        Descripción
        <input
          type="text"
          value={item.metadata.description || ''}
          onChange={(event) => setMetadataValue(item.id, 'description', event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
          placeholder="Detalle adicional del valor"
        />
      </label>
    );
  };

  const renderItem = (item: ItemDraft) => {
    const receivedNumber = Number(item.receivedAmount);
    const difference = Number.isFinite(receivedNumber)
      ? receivedNumber - item.expectedAmount
      : null;

    return (
      <div
        key={item.id}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {item.assetCode} · {item.assetType}
            </p>
            <p className="text-xs text-gray-500">
              Esperado: {formatCurrency(item.expectedAmount, item.assetCode)}
            </p>
          </div>
          {difference !== null && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                Math.abs(difference) < 0.01
                  ? 'bg-green-100 text-green-800'
                  : difference > 0
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Diferencia: {formatCurrency(difference, item.assetCode)}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs uppercase text-gray-500">
            Recibido / Entregado
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.receivedAmount}
              onChange={(event) => setDraftValue(item.id, 'receivedAmount', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              placeholder="0.00"
            />
          </label>
          <label className="text-xs uppercase text-gray-500">
            Pendiente
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.pendingAmount}
              onChange={(event) => setDraftValue(item.id, 'pendingAmount', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              placeholder="0.00"
            />
          </label>
          <label className="text-xs uppercase text-gray-500 flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.discrepancyFlag}
              onChange={(event) => setDraftValue(item.id, 'discrepancyFlag', event.target.checked)}
              className="rounded border-gray-300 text-danger focus:ring-danger"
            />
            Marcar discrepancia
          </label>
        </div>

        {item.discrepancyFlag && (
          <label className="text-xs uppercase text-gray-500 block">
            Motivo / Nota
            <textarea
              value={item.discrepancyReason}
              onChange={(event) => setDraftValue(item.id, 'discrepancyReason', event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
              rows={2}
            />
          </label>
        )}

        <div className="space-y-2">{renderMetadataFields(item)}</div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-text-primary">Conteo y traspaso en sitio</h2>
        <button
          type="button"
          onClick={onReportDiscrepancy}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          disabled={saving}
        >
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          Reportar discrepancia
        </button>
      </div>

      <Alert
        type="info"
        message="Registrá los montos recibidos/entregados por ítem y completá los metadatos obligatorios (cheques, metales). Guardá el conteo antes de finalizar."
      />

      {localMessage && (
        <Alert type={localMessage.type} message={localMessage.text} onClose={() => setLocalMessage(null)} />
      )}

      <div className="space-y-4">
        {drafts.map(renderItem)}
        {!drafts.length && (
          <p className="text-sm text-gray-500">No hay ítems cargados para esta orden.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <div>
          <p className="text-gray-500 uppercase text-xs">Total esperado</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.expected, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
        <div>
          <p className="text-gray-500 uppercase text-xs">Total registrado</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.received, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
        <div>
          <p className="text-gray-500 uppercase text-xs">Diferencia</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.received - totals.expected, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          disabled={saving}
        >
          <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
          Guardar conteo
        </button>

        <button
          type="button"
          onClick={onCompleteTotal}
          className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-70"
          disabled={saving}
        >
          <i className="fa-solid fa-check-double" aria-hidden="true" />
          Completar total
        </button>

        <button
          type="button"
          onClick={handlePartialCompletion}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          disabled={saving}
        >
          <i className="fa-solid fa-scale-balanced" aria-hidden="true" />
          Completar parcial
        </button>
      </div>
    </section>
  );
};

