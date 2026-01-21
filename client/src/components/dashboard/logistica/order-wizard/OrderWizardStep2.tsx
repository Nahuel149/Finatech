import React, { useMemo } from 'react';
import { LogisticsOrderBalance, LogisticsOrderItemMetadata } from '../../../../types/logistics';
import { FormItemErrors, LogisticsOrderFormItem } from './types';
import { formatCurrency } from '../../operaciones/transfer/utils';

interface OrderWizardStep2Props {
  items: LogisticsOrderFormItem[];
  balances: LogisticsOrderBalance[];
  errors: FormItemErrors;
  onItemChange: (itemId: string, field: keyof LogisticsOrderFormItem, value: any) => void;
  onMetadataChange: (itemId: string, field: keyof LogisticsOrderItemMetadata, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  getAvailableAmount: (assetCode: string, itemId: string) => number;
}

const ITEM_TYPE_OPTIONS = [
  { value: 'CURRENCY', label: 'Efectivo / Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'METAL', label: 'Metal precioso' },
  { value: 'OTHER', label: 'Otro valor' },
];

const metadataHelper = (item: LogisticsOrderFormItem) => {
  if (item.assetType === 'CHEQUE') {
    return 'Banco, número y fecha son obligatorios.';
  }
  if (item.assetType === 'METAL') {
    return 'Indicá tipo, pureza y peso del metal.';
  }
  if (item.assetType === 'OTHER') {
    return 'Describí el valor a trasladar.';
  }
  return 'Podés agregar observaciones específicas.';
};

export const OrderWizardStep2: React.FC<OrderWizardStep2Props> = ({
  items,
  balances,
  errors,
  onItemChange,
  onMetadataChange,
  onAddItem,
  onRemoveItem,
  getAvailableAmount,
}) => {
  const allocationsByAsset = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      if (!item.assetCode) return;
      const amount = Number(item.expectedAmount) || 0;
      if (!Number.isFinite(amount) || amount <= 0) return;
      map.set(item.assetCode, (map.get(item.assetCode) || 0) + amount);
    });
    return map;
  }, [items]);

  const remainingByAsset = useMemo(() => {
    const map = new Map<string, number>();
    balances.forEach((balance) => {
      const allocated = allocationsByAsset.get(balance.assetCode) || 0;
      const pending = Number(balance.pendingAmount) || 0;
      map.set(balance.assetCode, Math.max(0, pending - allocated));
    });
    return map;
  }, [balances, allocationsByAsset]);

  const selectedAssetCode = items[0]?.assetCode || balances[0]?.assetCode || 'ARS';
  const bannerBalance = balances.find((entry) => entry.assetCode === selectedAssetCode);
  const totalPending = remainingByAsset.get(selectedAssetCode) ?? bannerBalance?.pendingAmount ?? 0;

  const assetOptionsMap = useMemo(() => {
    const map = new Map<
      string,
      { assetCode: string; assetLabel: string; roles: Set<LogisticsOrderBalance['role']> }
    >();
    balances.forEach((balance) => {
      const entry = map.get(balance.assetCode);
      if (entry) {
        entry.roles.add(balance.role);
      } else {
        map.set(balance.assetCode, {
          assetCode: balance.assetCode,
          assetLabel: balance.assetLabel,
          roles: new Set([balance.role]),
        });
      }
    });
    return map;
  }, [balances]);

  const singleAsset = assetOptionsMap.size === 1;

  const assetOptions = useMemo(() => {
    return Array.from(assetOptionsMap.values()).map((entry) => {
      const rolesLabel =
        entry.roles.size > 1 ? 'Ingreso/Egreso' : entry.roles.has('incoming') ? 'Ingreso' : 'Egreso';
      const code = entry.assetCode;
      const baseLabel = entry.assetLabel || code;
      const normalized = baseLabel.toUpperCase();
      const codeToken = `(${code.toUpperCase()})`;
      const hasCode = normalized.includes(codeToken);
      const uniqueLabel = hasCode ? baseLabel : `${baseLabel} (${code})`;
      return {
        assetCode: entry.assetCode,
        label: `${uniqueLabel} · ${rolesLabel}`,
      };
    });
  }, [assetOptionsMap]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm text-indigo-800">
          Disponés de {formatCurrency(totalPending, selectedAssetCode)} para asignar en órdenes logísticas. Los montos no pueden superar el saldo pendiente por activo.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const itemError = errors[item.id] || {};
          const available = getAvailableAmount(item.assetCode, item.id);
          const remaining = remainingByAsset.get(item.assetCode) ?? available;
          const hideTypeAndAsset = singleAsset;

          return (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-text-primary">Ítem #{index + 1}</p>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={items.length === 1}
                >
                  <i className="fa-solid fa-trash mr-1" />
                  Eliminar
                </button>
              </div>

              <div className={`grid ${hideTypeAndAsset ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-3`}>
                {!hideTypeAndAsset && (
                  <>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Tipo</label>
                      <select
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.assetType ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.assetType}
                        onChange={(event) => onItemChange(item.id, 'assetType', event.target.value)}
                      >
                        {ITEM_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Activo / Divisa</label>
                      <select
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.assetCode ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.assetCode}
                        onChange={(event) => onItemChange(item.id, 'assetCode', event.target.value)}
                      >
                        {assetOptions.map((option) => (
                          <option key={option.assetCode} value={option.assetCode}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {itemError.assetCode && <p className="text-xs text-red-600 mt-1">{itemError.assetCode}</p>}
                    </div>
                  </>
                )}

                {hideTypeAndAsset && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-1">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Tipo</p>
                      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {ITEM_TYPE_OPTIONS.find((opt) => opt.value === item.assetType)?.label || 'Efectivo / Transferencia'}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-500">Activo / Divisa</p>
                      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {assetOptions[0]?.label || items[0]?.assetCode}
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-1">
                  <label className="text-xs uppercase text-gray-500">Monto esperado</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.expectedAmount ? 'border-red-300' : 'border-gray-300'}`}
                    value={item.expectedAmount}
                    onChange={(event) =>
                      onItemChange(item.id, 'expectedAmount', event.target.value === '' ? '' : Number(event.target.value))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponible: {formatCurrency(Math.max(0, remaining), item.assetCode)}
                  </p>
                  {itemError.expectedAmount && <p className="text-xs text-red-600">{itemError.expectedAmount}</p>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {item.assetType === 'CHEQUE' && (
                  <>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Banco *</label>
                      <input
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.bank ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.bank || ''}
                        onChange={(event) => onMetadataChange(item.id, 'bank', event.target.value)}
                      />
                      {itemError.bank && <p className="text-xs text-red-600">{itemError.bank}</p>}
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Número *</label>
                      <input
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.number ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.number || ''}
                        onChange={(event) => onMetadataChange(item.id, 'number', event.target.value)}
                      />
                      {itemError.number && <p className="text-xs text-red-600">{itemError.number}</p>}
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Fecha *</label>
                      <input
                        type="date"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.dueDate ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.dueDate ? item.metadata.dueDate.slice(0, 10) : ''}
                        onChange={(event) => onMetadataChange(item.id, 'dueDate', event.target.value)}
                      />
                      {itemError.dueDate && <p className="text-xs text-red-600">{itemError.dueDate}</p>}
                    </div>
                  </>
                )}

                {item.assetType === 'METAL' && (
                  <>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Tipo *</label>
                      <input
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.metalType ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.metalType || ''}
                        onChange={(event) => onMetadataChange(item.id, 'metalType', event.target.value)}
                      />
                      {itemError.metalType && <p className="text-xs text-red-600">{itemError.metalType}</p>}
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Pureza *</label>
                      <input
                        type="text"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.purity ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.purity || ''}
                        onChange={(event) => onMetadataChange(item.id, 'purity', event.target.value)}
                      />
                      {itemError.purity && <p className="text-xs text-red-600">{itemError.purity}</p>}
                    </div>
                    <div>
                      <label className="text-xs uppercase text-gray-500">Peso *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.weight ? 'border-red-300' : 'border-gray-300'}`}
                        value={item.metadata.weight ?? ''}
                        onChange={(event) => onMetadataChange(item.id, 'weight', event.target.value)}
                      />
                      {itemError.weight && <p className="text-xs text-red-600">{itemError.weight}</p>}
                    </div>
                  </>
                )}

                {item.assetType === 'OTHER' && (
                  <div className="md:col-span-3">
                    <label className="text-xs uppercase text-gray-500">Descripción *</label>
                    <textarea
                      className={`w-full border rounded-lg px-3 py-2 text-sm ${itemError.description ? 'border-red-300' : 'border-gray-300'}`}
                      rows={2}
                      value={item.metadata.description || ''}
                      onChange={(event) => onMetadataChange(item.id, 'description', event.target.value)}
                    />
                    {itemError.description && <p className="text-xs text-red-600">{itemError.description}</p>}
                  </div>
                )}
              </div>

              <div className="mt-3">
                <label className="text-xs uppercase text-gray-500">Notas del ítem</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  value={item.notes || ''}
                  onChange={(event) => onItemChange(item.id, 'notes', event.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{metadataHelper(item)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddItem}
        className="inline-flex items-center px-4 py-2 border border-dashed border-primary text-primary rounded-lg text-sm"
      >
        <i className="fa-solid fa-plus mr-2" />
        Agregar ítem
      </button>
    </div>
  );
};
