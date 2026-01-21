import React, { useEffect, useMemo, useState } from 'react';
import { LogisticsItemsHandoverPayload, LogisticsOrder, LogisticsOrderItem, LogisticsPartialCompletionPayload } from '../../../types/logistics';
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
  const [verificationCode, setVerificationCode] = useState('');
  const [dniConfirmed, setDniConfirmed] = useState(false);

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
    setVerificationCode('');
    setDniConfirmed(Boolean(order.handoverVerification?.verifiedDni));
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

  const completionDisabled = saving || !drafts.length;
  const verificationConfig = order.handoverVerification;
  const verificationRequired = Boolean(
    verificationConfig?.method || verificationConfig?.requiresDni
  );
  const verificationDone = Boolean(verificationConfig?.verifiedAt);
  const requiresCode =
    verificationRequired &&
    verificationConfig?.method &&
    verificationConfig.method !== 'DNI';
  const requiresDni = Boolean(
    verificationConfig?.requiresDni || verificationConfig?.method === 'DNI'
  );

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

  const buildItemsPayload = (): LogisticsItemsHandoverPayload => ({
    items: drafts.map((draft) => ({
      id: draft.id,
      receivedAmount: formatNumber(draft.receivedAmount),
      pendingAmount: formatNumber(draft.pendingAmount),
      discrepancyFlag: draft.discrepancyFlag,
      discrepancyReason: draft.discrepancyReason || undefined,
      metadata: draft.metadata,
    })),
    verification:
      verificationRequired && !verificationDone
        ? {
            method: verificationConfig?.method || undefined,
            code: verificationCode.trim() || undefined,
            dniConfirmed: requiresDni ? dniConfirmed : undefined,
          }
        : undefined,
  });

  const ensureAllReceivedRecorded = () => {
    const missing = drafts.filter(
      (draft) => draft.receivedAmount === '' || !Number.isFinite(Number(draft.receivedAmount))
    );
    if (missing.length) {
      setLocalMessage({
        type: 'error',
        text: 'Completá el monto recibido para cada ítem antes de finalizar.',
      });
      return false;
    }
    return true;
  };

  const ensureVerificationReady = () => {
    if (!verificationRequired || verificationDone) {
      return true;
    }
    if (requiresCode && !verificationCode.trim()) {
      setLocalMessage({
        type: 'error',
        text: 'Ingresa el codigo de verificacion antes de finalizar.',
      });
      return false;
    }
    if (requiresDni && !dniConfirmed) {
      setLocalMessage({
        type: 'error',
        text: 'Confirma el DNI de la contraparte antes de finalizar.',
      });
      return false;
    }
    return true;
  };

  const handleCompleteTotal = async () => {
    if (!ensureAllReceivedRecorded()) {
      return;
    }
    if (!ensureVerificationReady()) {
      return;
    }
    const payload = buildItemsPayload();
    const totalLabel = formatCurrency(totals.received || totals.expected, order.items[0]?.assetCode || 'ARS');
    const confirmed = window.confirm(`Completar total por ${totalLabel}?`);
    if (!confirmed) {
      return;
    }
    setLocalMessage(null);
    await onSaveItems(payload);
    await onCompleteTotal();
  };

  const handlePartialCompletion = async () => {
    if (!ensureAllReceivedRecorded()) {
      return;
    }
    if (!ensureVerificationReady()) {
      return;
    }
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

    const invalidPending = items.find(
      (item) => !Number.isFinite(item.pendingAmount) || item.pendingAmount < 0 || item.receivedAmount < 0
    );
    if (invalidPending) {
      setLocalMessage({
        type: 'error',
        text: 'Completá montos pendientes y recibidos válidos para los ítems seleccionados.',
      });
      return;
    }

    const payload = buildItemsPayload();
    await onSaveItems(payload);
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
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-text-primary">
              {item.assetCode} - {item.assetType}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Conteo y traspaso en sitio</h2>
        <button
          type="button"
          onClick={onReportDiscrepancy}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 w-full sm:w-auto justify-center"
          disabled={saving}
        >
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          Reportar discrepancia
        </button>
      </div>

      <Alert
        type="info"
        message="Registrá los montos recibidos/entregados por ítem y completá los metadatos obligatorios (cheques, metales). Podés finalizar directo."
      />

      {verificationRequired && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">Validacion de identidad</p>
            {verificationDone && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Verificada
              </span>
            )}
          </div>
          {!verificationDone && (
            <>
              {verificationConfig?.method && (
                <p className="text-xs text-gray-500">
                  Metodo: <span className="font-semibold">{verificationConfig.method}</span>
                </p>
              )}
              {requiresCode && (
                <label className="text-xs uppercase text-gray-500 block">
                  Codigo OTP / QR
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                    placeholder="Ingresar codigo"
                  />
                </label>
              )}
              {requiresDni && (
                <label className="text-xs uppercase text-gray-500 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dniConfirmed}
                    onChange={(event) => setDniConfirmed(event.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  DNI validado en sitio
                </label>
              )}
            </>
          )}
          {verificationDone && verificationConfig?.verifiedValueLast4 && (
            <p className="text-xs text-gray-500">
              Codigo verificado (termina en {verificationConfig.verifiedValueLast4})
            </p>
          )}
        </div>
      )}


      {localMessage && (
        <Alert type={localMessage.type} message={localMessage.text} onClose={() => setLocalMessage(null)} />
      )}

      <div className="space-y-4">
        {drafts.map(renderItem)}
        {!drafts.length && (
          <p className="text-sm text-gray-500">No hay ítems cargados para esta orden.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="flex flex-col">
          <p className="text-gray-500 uppercase text-xs">Total esperado</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.expected, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-gray-500 uppercase text-xs">Total registrado</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.received, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
        <div className="flex flex-col">
          <p className="text-gray-500 uppercase text-xs">Diferencia</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(totals.received - totals.expected, order.items[0]?.assetCode || 'ARS')}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCompleteTotal}
          className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-70 w-full sm:w-auto justify-center"
          disabled={completionDisabled}
          >
          <i className="fa-solid fa-check-double" aria-hidden="true" />
          Completar total
        </button>

        <button
          type="button"
          onClick={handlePartialCompletion}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 w-full sm:w-auto justify-center"
          disabled={completionDisabled}
        >
          <i className="fa-solid fa-scale-balanced" aria-hidden="true" />
          Completar parcial
        </button>
      </div>
    </section>
  );
};
