import React, { useEffect, useMemo, useState } from 'react';
import { useClientSearch, useCreateTransfer } from '../../../hooks';
import { CreateTransferResponse, MovementDirection, MovementMethod } from '../../../types';
import { Button } from '../../shared/design-system';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (resp: CreateTransferResponse) => void;
}

interface LineState {
  contactId?: string;
  contactName?: string | null;
  method: MovementMethod;
  amount: string; // keep as string for input
  query: string; // local search query for autocomplete
}

export const TransferPesosModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [direction, setDirection] = useState<MovementDirection>('outgoing');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [lines, setLines] = useState<LineState[]>([{ method: 'ARS', amount: '', query: '' }]);
  const { suggestions, loading: searching, setQuery } = useClientSearch('');
  const { execute, loading: creating, error, reset } = useCreateTransfer();

  useEffect(() => {
    if (!open) {
      setDirection('outgoing');
      setTotalAmount('');
      setLines([{ method: 'ARS', amount: '', query: '' }]);
      reset();
    }
  }, [open, reset]);

  const computedTotal = useMemo(() => {
    const sum = lines.reduce((acc, l) => acc + (parseFloat(l.amount || '0') || 0), 0);
    return sum;
  }, [lines]);

  const totalMismatch = useMemo(() => {
    const t = parseFloat(totalAmount || '0') || 0;
    return Math.abs(t - computedTotal) > 0.01;
  }, [totalAmount, computedTotal]);

  const addLine = () => setLines((prev) => [...prev, { method: 'ARS', amount: '', query: '' }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const pickSuggestion = (idx: number, contactId: string, contactName: string | null) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, contactId, contactName, query: contactName || '' } : l)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(totalAmount || '0') || 0;
    const payload = {
      movementType: 'transfer' as const,
      direction,
      totalAmount: t,
      distributionLines: lines
        .filter((l) => l.contactId && parseFloat(l.amount || '0') > 0)
        .map((l) => ({ contactId: l.contactId!, method: l.method, amount: parseFloat(l.amount) })),
    };

    try {
      const resp = await execute(payload);
      if (resp && onSuccess) onSuccess(resp);
      onClose();
    } catch {
      // error state handled via hook
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Transferir pesos</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon="fa-solid fa-times"
            aria-label="Cerrar modal"
          />
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Direction & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Dirección</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as MovementDirection)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="outgoing">Saliente</option>
                <option value="incoming">Entrante</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Monto total (ARS)</label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <div className="mt-1 text-xs text-gray-500">Suma líneas: {computedTotal.toFixed(2)}</div>
              {totalMismatch && (
                <div className="mt-1 text-xs text-orange-600">El total debe coincidir con la suma de líneas</div>
              )}
            </div>
          </div>

          {/* Distribution lines */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-600">Distribución</label>
              <button type="button" onClick={addLine} className="text-sm text-primary hover:underline">
                Agregar línea
              </button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 mb-3">
                {/* Contact autocomplete */}
                <div className="col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">Contacto</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={line.query}
                      onChange={(e) => {
                        const q = e.target.value;
                        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, query: q, contactId: undefined, contactName: undefined } : l)));
                        setQuery(q);
                      }}
                      placeholder="Buscar cliente"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                    {line.query && suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow">
                        {suggestions.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => pickSuggestion(idx, s.id, s.fullName)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          >
                            <div className="text-sm text-text-primary">{s.fullName}</div>
                            {s.cuit && <div className="text-xs text-gray-500">CUIT {s.cuit}</div>}
                          </button>
                        ))}
                        {searching && <div className="px-3 py-2 text-xs text-gray-500">Buscando…</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Method */}
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Método</label>
                  <select
                    value={line.method}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, method: e.target.value as MovementMethod } : l)))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="ARS">ARS (Transferencia)</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) => setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, amount: e.target.value } : l)))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                {/* Remove */}
                <div className="col-span-1 flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(idx)}
                    icon="fa-solid fa-trash"
                    className="text-danger hover:text-red-700"
                    aria-label="Eliminar línea"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end space-x-3 mt-4">
            {error && <div className="text-sm text-danger">{String(error)}</div>}
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={creating || totalMismatch || !lines.some((l) => l.contactId && parseFloat(l.amount || '0') > 0)}
              loading={creating}
            >
              {creating ? 'Registrando…' : 'Registrar transferencia'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
