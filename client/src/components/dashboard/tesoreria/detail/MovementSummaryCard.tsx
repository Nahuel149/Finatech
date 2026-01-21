import React from 'react';
import { TreasuryMovement } from '../../../../types/treasury';

interface MovementSummaryCardProps {
  movement: TreasuryMovement;
  contactName?: string | null;
}

const statusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  registered: {
    label: 'Registrado',
    classes: 'bg-yellow-100 text-yellow-800',
  },
  compensated: {
    label: 'Compensado',
    classes: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Anulado',
    classes: 'bg-red-100 text-red-800',
  },
};

const movementTypeLabel = (type?: string | null) =>
  type === 'outgoing' ? 'Egreso' : 'Ingreso';

const mediumLabel = (medium?: string | null) => {
  switch (medium) {
    case 'cash':
      return 'Efectivo';
    case 'transfer':
      return 'Transferencia';
    case 'deposit':
      return 'Depósito';
    default:
      return medium || '—';
  }
};

const formatCurrency = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
};

const formatDateTime = (movementAt?: string | null) => {
  if (!movementAt) {
    return { date: '—', time: '' };
  }
  const date = new Date(movementAt);
  if (Number.isNaN(date.getTime())) {
    return { date: '—', time: '' };
  }
  const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1
  ).padStart(2, '0')}/${date.getFullYear()}`;
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  return { date: dateStr, time: timeStr };
};

export const MovementSummaryCard: React.FC<MovementSummaryCardProps> = ({
  movement,
  contactName,
}) => {
  const statusKey = (movement.status || 'registered').toLowerCase();
  const status = statusConfig[statusKey] ?? statusConfig.registered;
  const amountLabel = formatCurrency(movement.amount, movement.currency || 'ARS');
  const isOutgoing = (movement.type || '').toLowerCase() === 'outgoing';
  const amountClass = isOutgoing ? 'negative-amount' : 'positive-amount';
  const { date, time } = formatDateTime(movement.movementAt);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Resumen del movimiento</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">ID de movimiento</div>
            <div className="text-lg font-mono text-text-primary">
              {movement.movementCode || movement.id || '—'}
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.classes}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Fecha y hora</div>
            <div className="text-sm font-medium text-text-primary">
              {date} <span className="text-gray-500">{time}</span>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Registrado por</div>
            <div className="text-sm font-medium text-text-primary">
              {String(movement.metadata?.createdByName || '—')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Tipo</div>
            <div className="text-sm font-medium text-text-primary">
              {movementTypeLabel(movement.type)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Medio</div>
            <div className="text-sm font-medium text-text-primary">
              {mediumLabel(movement.medium)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Moneda</div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {movement.currency || 'ARS'}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-600">Monto</div>
            <div className={`text-xl font-semibold ${amountClass}`}>
              {isOutgoing ? `-${amountLabel}` : amountLabel}
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Referencia</div>
          <div className="text-sm text-text-primary">
            {movement.reference || movement.description || '—'}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600">Contacto asociado</div>
          <div className="text-sm font-medium text-text-primary">{contactName || '—'}</div>
        </div>
      </div>
    </div>
  );
};
