import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../ui';
import { useCreateTransfer } from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';

interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const MOVEMENT_TYPE_TEXT: Record<string, string> = {
  transfer: 'Transferencia bancaria',
  cash: 'Efectivo en caja',
};

const DIRECTION_TEXT: Record<string, string> = {
  incoming: 'Entrante',
  outgoing: 'Saliente',
};

const MOVEMENT_TYPE_ICON: Record<string, string> = {
  transfer: 'fa-money-check-dollar',
  cash: 'fa-vault',
};

export const TransferPesosConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    draft,
    toPayload,
    setLastOperation,
  } = useTransferPesos();
  const { execute, loading, error } = useCreateTransfer();

  const [toast, setToast] = useState<ToastState | null>(null);

  const payload = useMemo(() => toPayload(), [toPayload]);

  const readyForSubmit =
    draft.movementType &&
    draft.direction &&
    draft.totalAmount > 0 &&
    draft.distributionLines.length > 0 &&
    payload &&
    Math.abs(
      draft.distributionLines.reduce((sum, line) => sum + line.amount, 0) - draft.totalAmount
    ) < 0.01;

  useEffect(() => {
    if (!readyForSubmit) {
      navigate('/dashboard/operaciones/transfer-pesos', { replace: true });
    }
  }, [navigate, readyForSubmit]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!readyForSubmit) {
    return null;
  }

  const totalARS = draft.distributionLines
    .filter((line) => line.method === 'ARS')
    .reduce((sum, line) => sum + line.amount, 0);

  const totalUSD = draft.distributionLines
    .filter((line) => line.method === 'USD')
    .reduce((sum, line) => sum + line.amount, 0);

  const handleBack = () => {
    navigate('/dashboard/operaciones/transfer-pesos?step=distribution');
  };

  const handleSaveDraft = () => {
    setToast({
      type: 'info',
      message: 'Pronto podrás guardar borradores desde esta etapa.',
    });
  };

  const handleConfirm = async () => {
    if (!payload || !draft.movementType || !draft.direction) {
      return;
    }
    try {
      const response = await execute({
        movementType: draft.movementType,
        direction: draft.direction,
        totalAmount: draft.totalAmount,
        distributionLines: payload,
      });
      setLastOperation(response.operation);
      navigate('/dashboard/operaciones/transfer-pesos/completada', { replace: true });
    } catch {
      // Error handled by hook state
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search="" onSearchChange={() => {}} />
      <BalanceStripe />

      <main className="pt-[200px] px-6 pb-32 max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Confirmación de transferencia</h1>
              <p className="text-gray-600">Revisá la configuración y confirmá la operación</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="text-xs uppercase text-gray-500 mb-1">Resumen</div>
              <div className="text-text-primary font-semibold">
                {formatCurrency(draft.totalAmount)}
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error.message || 'No pudimos registrar la transferencia.'} />
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <i
                  className={`fa-solid ${
                    MOVEMENT_TYPE_ICON[draft.movementType!] || 'fa-cog'
                  } text-primary mr-3`}
                />
                Configuración
              </h3>
              <button
                type="button"
                onClick={() => navigate('/dashboard/operaciones/transfer-pesos?step=1')}
                className="text-primary hover:text-blue-700 text-sm font-medium"
              >
                <i className="fa-solid fa-edit mr-1" />
                Editar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-sm font-medium text-gray-600 block mb-1">
                  Tipo de movimiento
                </span>
                <span className="text-text-primary font-medium">
                  {MOVEMENT_TYPE_TEXT[draft.movementType!] || draft.movementType}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 block mb-1">
                  Dirección
                </span>
                <span className="text-text-primary font-medium">
                  {DIRECTION_TEXT[draft.direction!] || draft.direction}
                </span>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <i className="fa-solid fa-dollar-sign text-primary mr-3" />
                Monto total
              </h3>
              <button
                type="button"
                onClick={() => navigate('/dashboard/operaciones/transfer-pesos?step=amount')}
                className="text-primary hover:text-blue-700 text-sm font-medium"
              >
                <i className="fa-solid fa-edit mr-1" />
                Editar
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(draft.totalAmount)}
              </div>
              <div className="text-sm text-blue-700 mt-1">Pesos argentinos</div>
            </div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <i className="fa-solid fa-users text-primary mr-3" />
                Distribución
              </h3>
              <button
                type="button"
                onClick={() =>
                  navigate('/dashboard/operaciones/transfer-pesos?step=distribution')
                }
                className="text-primary hover:text-blue-700 text-sm font-medium"
              >
                <i className="fa-solid fa-edit mr-1" />
                Editar
              </button>
            </div>

            <div className="space-y-3">
              {draft.distributionLines.map((line) => (
                <div
                  key={line.id}
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
                      <div className="font-medium text-text-primary">{line.contactName || 'Contacto sin definir'}</div>
                      <div className="text-sm text-gray-600">
                        {line.contactType === 'provider' ? 'Proveedor' : 'Cliente'}
                        {line.cuit ? ` • ${line.cuit}` : ''}
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
                <span className="text-gray-600">Total distribuido ARS:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalARS)}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total distribuido USD:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalUSD, 'USD')}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total general:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(draft.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-4xl mx-auto space-y-3 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 text-gray-700 hover:text-text-primary transition-colors font-medium"
              >
                <i className="fa-solid fa-arrow-left mr-2" />
                Atrás
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <i className="fa-solid fa-save mr-2" />
                Guardar borrador
              </button>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                loading ? 'bg-success bg-opacity-80 text-white cursor-not-allowed' : 'bg-success text-white hover:bg-green-700'
              }`}
            >
              {loading && <i className="fa-solid fa-spinner fa-spin mr-2" />}
              <span>Confirmar operación</span>
              {!loading && <i className="fa-solid fa-check ml-2" />}
            </button>
          </div>
        </div>
      </footer>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
