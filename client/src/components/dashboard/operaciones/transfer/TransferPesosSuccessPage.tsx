import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { Alert } from '../../../ui';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency, formatDateTime } from './utils';
import { TransferAccountingPanel } from './TransferAccountingPanel';

interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const TransferPesosSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { lastOperation, reset } = useTransferPesos();
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!lastOperation) {
      navigate('/dashboard/operaciones/transfer-pesos', { replace: true });
    }
  }, [lastOperation, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!lastOperation) {
    return null;
  }

  const totalARS = lastOperation.distributionLines
    .filter((line) => line.method === 'ARS')
    .reduce((sum, line) => sum + line.amount, 0);

  const totalUSD = lastOperation.distributionLines
    .filter((line) => line.method === 'USD')
    .reduce((sum, line) => sum + line.amount, 0);

  const handleViewDetail = () => {
    setToast({
      type: 'info',
      message: 'Próximamente podrás acceder al detalle completo de la transferencia.',
    });
  };

  const handleNewTransfer = () => {
    reset();
    navigate('/dashboard/operaciones/transfer-pesos');
  };

  const handleBackToOperations = () => {
    navigate('/dashboard/operaciones');
  };

  const accountingSummary = {
    timestamp: lastOperation.confirmedAt || lastOperation.updatedAt || lastOperation.createdAt,
    entries: lastOperation.distributionLines.map((line) => ({
      label: line.method === 'USD' ? 'Cuentas a Cobrar USD' : 'Cuentas a Cobrar ARS',
      currency: line.method === 'USD' ? 'USD' : 'ARS',
      amount: line.amount,
      contact: line.contactName || '—',
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search="" onSearchChange={() => {}} />
      <BalanceStripe />

      <main className="pt-[200px] px-6 pb-32 max-w-4xl mx-auto">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center mb-8">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-check text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Transferencia registrada correctamente
          </h1>
          <p className="text-gray-600 mb-6">
            La operación fue guardada y actualizamos los saldos correspondientes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 inline-block">
            <div className="text-sm text-blue-700 font-medium mb-1">ID de operación</div>
            <div className="text-xl font-bold text-blue-900">
              {lastOperation.operationCode || lastOperation.id}
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-center md:space-x-4 space-y-3 md:space-y-0">
            <button
              type="button"
              onClick={handleViewDetail}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fa-solid fa-eye mr-2" />
              Ver detalle
            </button>
            <button
              type="button"
              onClick={handleNewTransfer}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <i className="fa-solid fa-plus mr-2" />
              Registrar otra transferencia
            </button>
            <button
              type="button"
              onClick={handleBackToOperations}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <i className="fa-solid fa-arrow-left mr-2" />
              Volver a Operaciones
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <i className="fa-solid fa-circle-info text-primary mr-3" />
                Resumen de operación
              </h3>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="text-primary hover:text-blue-700 text-sm font-medium"
              >
                <i className="fa-solid fa-scale-balanced mr-1" />
                Ver impacto contable
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Tipo</span>
                <span className="text-text-primary font-medium">
                  {lastOperation.movementType === 'cash' ? 'Efectivo' : 'Transferencia'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Dirección</span>
                <span className="text-text-primary font-medium">
                  {lastOperation.direction === 'incoming' ? 'Entrante' : 'Saliente'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Registrado</span>
                <span className="text-text-primary font-medium">
                  {formatDateTime(lastOperation.confirmedAt || lastOperation.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-text-primary flex items-center mb-4">
              <i className="fa-solid fa-users text-primary mr-3" />
              Distribución registrada
            </h3>

            <div className="space-y-3">
              {lastOperation.distributionLines.map((line) => (
                <div
                  key={line.lineId}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                      <i
                        className={`fa-solid ${
                          line.contactType === 'provider' ? 'fa-building' : 'fa-user'
                        } text-sm`}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {line.contactName || 'Contacto sin definir'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {line.contactType === 'provider' ? 'Proveedor' : 'Cliente'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-3 md:mt-0">
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

            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total ARS:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalARS)}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total USD:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalUSD, 'USD')}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total general:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(lastOperation.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}

      <TransferAccountingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        operation={lastOperation}
        summary={accountingSummary}
      />
    </div>
  );
};
