import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useTransferPesos } from './TransferPesosContext';
import { emitDashboardBalanceRefresh } from '../../../../utils/balanceEvents';
import { TransferAccountingPanel } from './TransferAccountingPanel';
import { buildAccountingEntries } from './utils';

export const TransferPesosSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { lastOperation, reset } = useTransferPesos();
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!lastOperation) {
      navigate('/dashboard/operaciones/transfer-pesos', { replace: true });
    }
  }, [lastOperation, navigate]);

  useEffect(() => {
    if (lastOperation) {
      emitDashboardBalanceRefresh();
    }
  }, [lastOperation]);

  const accountingSummary = useMemo(() => {
    if (!lastOperation) {
      return {
        timestamp: null,
        entries: [],
      };
    }
    return {
      timestamp: lastOperation.confirmedAt || lastOperation.updatedAt || lastOperation.createdAt,
      entries: buildAccountingEntries(lastOperation),
    };
  }, [lastOperation]);

  if (!lastOperation) {
    return null;
  }

  const handleViewDetail = () => {
    setPanelOpen(true);
  };

  const handleNewTransfer = () => {
    reset();
    navigate('/dashboard/operaciones/transfer-pesos');
  };

  const handleBackToOperations = () => {
    navigate('/dashboard/operaciones');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search="" onSearchChange={() => {}} />
      <BalanceStripe />

      <main className="pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-24 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-check text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Transferencia registrada correctamente
            </h2>
            <p className="text-gray-600 mb-6">
              La operación ha sido guardada exitosamente en el sistema
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-blue-700 font-medium mb-1">ID de operación</div>
            <div className="text-xl font-bold text-blue-900">
              #{lastOperation.operationCode || lastOperation.id}
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleViewDetail}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fa-solid fa-eye mr-2" />
              Ver detalle
            </button>
            <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </main>

      <TransferAccountingPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        operation={lastOperation}
        summary={accountingSummary}
      />
    </div>
  );
};
