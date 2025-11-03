import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../../ui';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { apiRequest, handleApiError } from '../../../../utils/api';
import {
  ApiError,
  TransferOperation,
} from '../../../../types';
import {
  buildAccountingEntries,
  formatCurrency,
  formatDateTime,
} from './utils';
import { TransferAccountingPanel } from './TransferAccountingPanel';

const MOVEMENT_TYPE_TEXT: Record<string, string> = {
  transfer: 'Transferencia bancaria',
  cash: 'Efectivo en caja',
};

const DIRECTION_TEXT: Record<string, string> = {
  incoming: 'Entrante',
  outgoing: 'Saliente',
};

const STATUS_BADGE: Record<
  'pending' | 'registered' | 'completed' | 'cancelled',
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className:
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700',
  },
  registered: {
    label: 'En proceso',
    className:
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
  },
  completed: {
    label: 'Completada',
    className:
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelada',
    className:
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700',
  },
};

export const TransferPesosDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { operationId } = useParams<{ operationId: string }>();
  const [operation, setOperation] = useState<TransferOperation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!operationId) {
      navigate('/dashboard/operaciones', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    apiRequest<TransferOperation>(`/api/transfers/pesos/${operationId}`)
      .then((response) => {
        if (!cancelled) {
          setOperation(response);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(handleApiError(err));
          setOperation(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [operationId, navigate]);

  const accountingSummary = useMemo(() => {
    if (!operation) {
      return {
        timestamp: null,
        entries: [],
      };
    }
    return {
      timestamp: operation.confirmedAt || operation.updatedAt || operation.createdAt,
      entries: buildAccountingEntries(operation),
    };
  }, [operation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search="" onSearchChange={() => {}} />
        <BalanceStripe />
        <main className="pt-[240px] px-6 pb-32 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center text-gray-600">
            Cargando los datos de la transferencia…
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search="" onSearchChange={() => {}} />
        <BalanceStripe />
        <main className="pt-[240px] px-6 pb-32 max-w-4xl mx-auto">
          <div className="mb-6">
            <Alert
              type="error"
              message={
                error.message || 'No pudimos recuperar la transferencia solicitada.'
              }
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Volver a Operaciones
          </button>
        </main>
      </div>
    );
  }

  if (!operation) {
    return null;
  }

  const totalARS = operation.distributionLines
    .filter((line) => line.method === 'ARS')
    .reduce((sum, line) => sum + line.amount, 0);

  const totalUSD = operation.distributionLines
    .filter((line) => line.method === 'USD')
    .reduce((sum, line) => sum + line.amount, 0);

  const statusBadge = STATUS_BADGE[operation.status] ?? STATUS_BADGE.registered;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search="" onSearchChange={() => {}} />
      <BalanceStripe />

      <main className="pt-[240px] px-6 pb-32 max-w-4xl mx-auto space-y-8">
        <header className="bg-white rounded-lg border border-gray-200 shadow-sm p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                Transferencia en pesos
              </p>
              <h1 className="text-2xl font-bold text-text-primary mb-3">
                {operation.operationCode || operation.id}
              </h1>
              <p className="text-gray-600">
                Registrada el {formatDateTime(operation.confirmedAt || operation.createdAt)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-16 md:mt-0">
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
              >
                <i className="fa-solid fa-scale-balanced mr-2" />
                Ver impacto contable
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Volver a Operaciones
              </button>
            </div>
          </div>
        </header>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center">
            <i className="fa-solid fa-gear text-primary mr-3" />
            Configuración
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <span className="text-gray-600 block mb-2">Tipo de movimiento</span>
              <span className="text-text-primary font-semibold">
                {MOVEMENT_TYPE_TEXT[operation.movementType] || operation.movementType}
              </span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-600 block mb-2">Dirección</span>
              <span className="text-text-primary font-semibold">
                {DIRECTION_TEXT[operation.direction] || operation.direction}
              </span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-600 block mb-2">Estado</span>
              <span className={statusBadge.className}>{statusBadge.label}</span>
            </div>
            <div className="space-y-2">
              <span className="text-gray-600 block mb-2">Moneda</span>
              <span className="text-text-primary font-semibold">{operation.currency}</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-6 flex items-center">
            <i className="fa-solid fa-dollar-sign text-primary mr-3" />
            Monto total
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(operation.totalAmount)}
            </div>
            <div className="text-sm text-blue-700 mt-3">Pesos argentinos</div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary flex items-center">
              <i className="fa-solid fa-users text-primary mr-3" />
              Distribución a contactos
            </h2>
          </div>

          <div className="space-y-4">
            {operation.distributionLines.map((line) => (
              <div
                key={line.lineId}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-6 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                    <i
                      className={`fa-solid ${
                        line.contactType === 'provider' ? 'fa-building' : 'fa-user'
                      } text-sm`}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-text-primary">
                      {line.contactName || 'Contacto sin definir'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {line.contactType === 'provider' ? 'Proveedor' : 'Cliente'}
                    </div>
                  </div>
                </div>
                <div className="text-right mt-4 md:mt-0 space-y-1">
                  <div className="font-semibold text-text-primary">
                    {line.method === 'USD'
                      ? formatCurrency(line.amount, 'USD')
                      : formatCurrency(line.amount)}
                  </div>
                  <div className="text-sm text-gray-600">{line.method}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center justify-between md:justify-start md:space-x-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total distribuido ARS:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(totalARS)}
              </span>
            </div>
            <div className="flex items-center justify-between md:justify-start md:space-x-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total distribuido USD:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(totalUSD, 'USD')}
              </span>
            </div>
            <div className="flex items-center justify-between md:justify-start md:space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-700 font-medium">Total general:</span>
              <span className="font-bold text-blue-900">
                {formatCurrency(operation.totalAmount)}
              </span>
            </div>
          </div>
        </section>
      </main>

      <TransferAccountingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        operation={operation}
        summary={accountingSummary}
      />
    </div>
  );
};

export default TransferPesosDetailPage;
