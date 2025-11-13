import React from 'react';
import { LogisticsOrderBalance, LogisticsOrderOperationContext } from '../../../../types';
import { LogisticsOrderFormState } from './types';
import { formatCurrency, formatDateTime } from '../../operaciones/transfer/utils';

interface OrderWizardSummaryProps {
  form: LogisticsOrderFormState;
  operation: LogisticsOrderOperationContext | null;
  balances: LogisticsOrderBalance[];
}

export const OrderWizardSummary: React.FC<OrderWizardSummaryProps> = ({ form, operation, balances }) => {
  const totalByAsset = form.items.reduce<Record<string, number>>((acc, item) => {
    const amount = Number(item.expectedAmount) || 0;
    if (!acc[item.assetCode]) {
      acc[item.assetCode] = 0;
    }
    acc[item.assetCode] += amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Revisá los datos antes de confirmar. Podés volver a pasos anteriores para ajustar información. Guardar como borrador mantiene la orden editable; Programar la deja lista para logística.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
          <h4 className="text-xs uppercase text-gray-500">Datos principales</h4>
          <p><span className="text-gray-500">Tipo:</span> <span className="font-semibold text-text-primary">{form.type}</span></p>
          <p><span className="text-gray-500">Origen:</span> <span className="font-semibold text-text-primary">{form.origin}</span></p>
          <p><span className="text-gray-500">Destino:</span> <span className="font-semibold text-text-primary">{form.destination}</span></p>
          <p><span className="text-gray-500">Ventana:</span> {formatDateTime(form.windowStart)} · {formatDateTime(form.windowEnd)}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
          <h4 className="text-xs uppercase text-gray-500">Contacto</h4>
          <p><span className="text-gray-500">Nombre:</span> <span className="font-semibold text-text-primary">{form.contactName}</span></p>
          <p><span className="text-gray-500">Teléfono:</span> <span className="font-semibold text-text-primary">{form.contactPhone}</span></p>
          <p><span className="text-gray-500">Mensajero:</span> {form.messenger || 'Sin definir'}</p>
          {operation && <p><span className="text-gray-500">Operación:</span> {operation.code || operation.id}</p>}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-text-primary">Ítems de valor</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {form.items.map((item, index) => (
            <div key={item.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-gray-500">Ítem #{index + 1}</p>
                <p className="font-semibold text-text-primary">{item.assetCode}</p>
                {item.assetType !== 'CURRENCY' && (
                  <p className="text-xs text-gray-500">{item.assetType}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Monto esperado</p>
                <p className="font-semibold text-text-primary">
                  {formatCurrency(Number(item.expectedAmount) || 0, item.assetCode)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Detalle</p>
                <p className="text-gray-600">
                  {item.assetType === 'CHEQUE' && `${item.metadata.bank || 'Banco'} · ${item.metadata.number || 'N°'}`}
                  {item.assetType === 'METAL' && `${item.metadata.metalType || 'Metal'} · ${item.metadata.weight || 0}g`}
                  {item.assetType === 'OTHER' && (item.metadata.description || 'Valor')}
                  {item.assetType === 'CURRENCY' && (item.notes || '—')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Notas</p>
                <p className="text-gray-600">{item.notes || item.metadata.description || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(totalByAsset).map(([assetCode, amount]) => {
          const balance = balances.find((entry) => entry.assetCode === assetCode);
          const pendingAfter = balance ? Math.max(0, balance.pendingAmount - amount) : undefined;
          return (
            <div key={assetCode} className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500">{assetCode}</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(amount, assetCode)}</p>
              {balance && (
                <p className="text-xs text-gray-500">Pendiente luego de esta orden: {formatCurrency(pendingAfter || 0, assetCode)}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
