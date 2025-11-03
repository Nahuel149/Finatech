import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../../ui';
import { useCreateTransfer } from '../../../../hooks/dashboard';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';
import { useLatestMarketRate } from '../../../../hooks/dashboard/useLatestMarketRate';

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
    saveDraft,
  } = useTransferPesos();
  const { execute, loading, error } = useCreateTransfer();

  const [toast, setToast] = useState<ToastState | null>(null);
  const {
    data: usdMarketRate,
    loading: rateLoading,
    error: rateError,
    refresh: refreshRate,
  } = useLatestMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' });
  const usdToArsRate = usdMarketRate?.rate && usdMarketRate.rate > 0 ? usdMarketRate.rate : null;

  const payload = useMemo(() => toPayload(), [toPayload]);
  const baseValid = Boolean(
    draft.movementType &&
      draft.direction &&
      draft.totalAmount > 0 &&
      draft.distributionLines.length > 0 &&
      payload
  );
  const hasUsdLines = useMemo(
    () => draft.distributionLines.some((line) => line.method === 'USD'),
    [draft.distributionLines]
  );
  const totalAssignedArs = useMemo(() => {
    return draft.distributionLines.reduce((sum, line) => {
      if (line.method === 'USD') {
        if (!usdToArsRate) {
          return sum;
        }
        return sum + line.amount * usdToArsRate;
      }
      return sum + line.amount;
    }, 0);
  }, [draft.distributionLines, usdToArsRate]);

  const readyForSubmit =
    baseValid &&
    (!hasUsdLines || !!usdToArsRate) &&
    Math.abs(totalAssignedArs - draft.totalAmount) < 0.01;

  useEffect(() => {
    if (!baseValid) {
      navigate('/dashboard/operaciones/transfer-pesos', { replace: true });
    }
  }, [baseValid, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalARS = useMemo(
    () =>
      draft.distributionLines
        .filter((line) => line.method === 'ARS')
        .reduce((sum, line) => sum + line.amount, 0),
    [draft.distributionLines]
  );

  const totalUSD = useMemo(
    () =>
      draft.distributionLines
        .filter((line) => line.method === 'USD')
        .reduce((sum, line) => sum + line.amount, 0),
    [draft.distributionLines]
  );

  const submitDisabledReason = !readyForSubmit
    ? hasUsdLines && !usdToArsRate
      ? 'Esperando tasa USD/ARS'
      : 'Revisá la distribución'
    : null;

  if (!baseValid) {
    return null;
  }

  const handleBack = () => {
    navigate('/dashboard/operaciones/transfer-pesos?step=distribution');
  };

  const handleSaveDraft = async () => {
    const success = await saveDraft();
    if (success) {
      setToast({
        type: 'success',
        message: 'Borrador guardado exitosamente.',
      });
    } else {
      setToast({
        type: 'error',
        message: 'Error al guardar el borrador. Intentá nuevamente.',
      });
    }
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
        exchangeRates: usdToArsRate ? { usdArs: usdToArsRate } : undefined,
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

      <main className="pt-[550px] lg:pt-[250px] px-4 lg:px-6 pb-24 max-w-4xl mx-auto">
        {/* SECTION: Header and Breadcrumbs */}
        <section className="mb-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate('/dashboard/operaciones')}
              className="hover:text-primary transition-colors"
            >
              Operaciones
            </button>
            <i className="fa-solid fa-chevron-right text-xs" />
            <button 
              onClick={() => navigate('/dashboard/operaciones/transfer-pesos')}
              className="hover:text-primary transition-colors"
            >
              Transferencia en ARS
            </button>
            <i className="fa-solid fa-chevron-right text-xs" />
            <span className="text-text-primary font-medium">Confirmación</span>
          </nav>
          
          {/* Page Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={handleBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fa-solid fa-arrow-left text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Confirmación de operación</h1>
                <p className="text-gray-600">Verificá los datos antes de confirmar la operación</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error.message || 'No pudimos registrar la transferencia.'} />
          </div>
        )}
        {hasUsdLines && rateLoading && (
          <div className="mb-6">
            <Alert type="info" message="Obteniendo tasa USD/ARS…" />
          </div>
        )}
        {rateError && hasUsdLines && !usdToArsRate && (
          <div className="mb-6">
            <Alert
              type="error"
              message="No pudimos obtener la tasa USD/ARS. Intentá nuevamente antes de confirmar."
            />
          </div>
        )}
        {hasUsdLines && !usdToArsRate && !rateLoading && !rateError && (
          <div className="mb-6">
            <Alert
              type="warning"
              message="Necesitamos un tipo de cambio USD/ARS válido para confirmar la operación."
            />
          </div>
        )}

        {/* SECTION: Configuration */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-text-primary flex items-center">
              <i
                className={`fa-solid ${
                  MOVEMENT_TYPE_ICON[draft.movementType!] || 'fa-cog'
                } text-primary mr-3`}
              />
              Configuración
            </h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/operaciones/transfer-pesos?step=1')}
              className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-edit text-xs" />
              <span>Editar</span>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Tipo de movimiento</label>
                <p className="text-base font-medium text-text-primary">
                  {MOVEMENT_TYPE_TEXT[draft.movementType!] || draft.movementType}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Dirección</label>
                <p className="text-base font-medium text-text-primary">
                  {DIRECTION_TEXT[draft.direction!] || draft.direction}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Total Amount */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-text-primary flex items-center">
              <i className="fa-solid fa-dollar-sign text-primary mr-3" />
              Monto total
            </h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/operaciones/transfer-pesos?step=amount')}
              className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-edit text-xs" />
              <span>Editar</span>
            </button>
          </div>
          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(draft.totalAmount)}
              </div>
              <div className="text-sm text-blue-700 mt-1">Pesos argentinos</div>
            </div>
          </div>
        </section>

        {/* SECTION: Distribution */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-text-primary flex items-center">
              <i className="fa-solid fa-users text-primary mr-3" />
              Distribución
            </h2>
            <button
              type="button"
              onClick={() =>
                navigate('/dashboard/operaciones/transfer-pesos?step=distribution')
              }
              className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-edit text-xs" />
              <span>Editar</span>
            </button>
          </div>
          <div className="p-6">

            <div className="space-y-4">
              {draft.distributionLines.map((line) => (
                <div
                  key={line.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                      <i
                        className={`fa-solid ${
                          line.contactType === 'provider' ? 'fa-building' : 'fa-user'
                        } text-sm`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-text-primary text-base">{line.contactName || 'Contacto sin definir'}</div>
                      <div className="text-sm text-gray-600">
                        {line.contactType === 'provider' ? 'Proveedor' : 'Cliente'}
                        {line.cuit ? ` • ${line.cuit}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-3 md:mt-0 space-y-1">
                    <div className="font-semibold text-text-primary text-lg">
                      {line.method === 'USD'
                        ? formatCurrency(line.amount, 'USD')
                        : formatCurrency(line.amount)}
                    </div>
                    <div className="text-sm text-gray-600">{line.method}</div>
                    {line.method === 'USD' && usdToArsRate && (
                      <div className="text-xs text-gray-500">
                        ≈ {formatCurrency(line.amount * usdToArsRate)} ARS
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Equivalente en ARS:</span>
                <span className="font-semibold text-text-primary">
                  {hasUsdLines && !usdToArsRate
                    ? '—'
                    : formatCurrency(totalAssignedArs)}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Detalle ARS:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalARS)}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Detalle USD:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(totalUSD, 'USD')}
                </span>
              </div>
              <div className="flex items-center justify-between md:justify-start md:space-x-2">
                <span className="text-gray-600">Total operación:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(draft.totalAmount)}
                </span>
              </div>
            </div>
            {hasUsdLines && (
              <div className="mt-4 text-xs text-gray-500">
                Tasa USD→ARS utilizada:{' '}
                {usdToArsRate
                  ? usdToArsRate.toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })
                  : rateLoading
                  ? 'Obteniendo…'
                  : 'No disponible'}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fa-solid fa-arrow-left" />
              <span>Atrás</span>
            </button>
            
            <div className="flex space-x-4 items-center">
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                <i className="fa-solid fa-save text-sm" />
                <span>{loading ? 'Guardando...' : 'Guardar borrador'}</span>
              </button>
              {hasUsdLines && !usdToArsRate && (
                <button
                  type="button"
                  onClick={() => refreshRate().catch(() => {})}
                  className="flex items-center space-x-2 px-4 py-3 border border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                  disabled={rateLoading || loading}
                >
                  <i className="fa-solid fa-sync" />
                  <span>{rateLoading ? 'Actualizando…' : 'Actualizar tasa'}</span>
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={loading || !readyForSubmit}
                className="flex items-center space-x-2 px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium shadow-sm"
              >
                <i className="fa-solid fa-check text-sm" />
                <span>
                  {loading
                    ? 'Confirmando...'
                    : submitDisabledReason
                    ? submitDisabledReason
                    : 'Confirmar operación'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
