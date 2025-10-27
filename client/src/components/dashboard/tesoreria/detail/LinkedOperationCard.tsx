import React from 'react';
import { TreasuryMovementOperationLink } from '../../../../types';

interface LinkedOperationCardProps {
  operation: TreasuryMovementOperationLink | null;
  onViewOperation: () => void;
}

const statusBadgeClass = (status?: string | null) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'compensated') return 'bg-green-100 text-green-800';
  if (normalized === 'registered') return 'bg-yellow-100 text-yellow-800';
  if (normalized === 'cancelled') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const modelLabel = (model?: string | null) => {
  if (!model) return 'Operación';
  if (model === 'TransferOperation') return 'Transferencia en Pesos';
  if (model === 'Transaction') return 'Operación Comercial';
  return model;
};

export const LinkedOperationCard: React.FC<LinkedOperationCardProps> = ({
  operation,
  onViewOperation,
}) => {
  if (!operation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-text-primary mb-4">Operación vinculada</h4>
        <p className="text-sm text-gray-500">No hay operaciones vinculadas a este movimiento.</p>
      </div>
    );
  }

  const amountLabel = formatCurrency(operation.amount, operation.currency || 'ARS');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h4 className="text-lg font-semibold text-text-primary mb-4">Operación vinculada</h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">ID de operación</div>
            <div className="text-sm font-mono text-primary">{operation.code || '—'}</div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(operation.type)}`}>
            {operation.type || '—'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Tipo</div>
            <div className="text-sm font-medium text-text-primary">
              {modelLabel(operation.model)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Moneda</div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {operation.currency || 'ARS'}
            </span>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Monto asociado</div>
          <div className="text-lg font-semibold text-text-primary">{amountLabel}</div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <button
            type="button"
            className="text-primary hover:text-blue-700 text-sm font-medium"
            onClick={onViewOperation}
          >
            <i className="fa-solid fa-external-link-alt mr-1" />
            Ver operación
          </button>
        </div>
      </div>
    </div>
  );
};
