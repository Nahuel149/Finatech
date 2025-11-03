import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TransferOperation } from '../../../../types';
import { useCurrentUser } from '../../../../hooks';
import {
  AccountingSummaryEntry,
  formatCurrency,
  formatDateTime,
} from './utils';

interface AccountingSummary {
  timestamp?: string | null;
  entries: AccountingSummaryEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  operation: TransferOperation;
  summary: AccountingSummary;
}

export const TransferAccountingPanel: React.FC<Props> = ({
  open,
  onClose,
  operation,
  summary,
}) => {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  // Format operation ID with # prefix
  const operationId = operation.operationCode || operation.id;
  const formattedOperationId = operationId.startsWith('#') ? operationId : `#${operationId}`;
  
  // Get user display name
  const userDisplayName = user?.fullName || 'Usuario FinaTech';

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-start justify-end transition-opacity ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-xl h-full bg-white shadow-2xl border-l border-gray-200 transform transition-transform overflow-y-auto ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Impacto contable generado</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Estos movimientos se registraron automáticamente en las cuentas corrientes y saldos de Tesorería
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fa-solid fa-times text-gray-600" />
              </button>
            </div>
          </header>

          <div className="px-6 py-6">
            {/* Operation Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-blue-700">ID de operación</div>
                  <div className="text-lg font-bold text-blue-900">{formattedOperationId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-700">Fecha y hora</div>
                  <div className="text-blue-900">{formatDateTime(summary.timestamp)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-700">Usuario</div>
                  <div className="text-blue-900">{userDisplayName} • Operador Senior</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-700">Tipo</div>
                  <div className="text-blue-900">Transferencia ARS</div>
                </div>
              </div>
            </div>

            {/* Movements Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Movimientos generados</h3>
              <div className="space-y-3 sm:hidden">
                {summary.entries.map((entry, index) => {
                  const signedAmount = entry.amount === 0 ? 0 : entry.amount * entry.sign;
                  const amountClass = entry.sign === 1 ? 'text-success' : 'text-danger';
                  return (
                    <div
                      key={`${entry.label}-card-${index}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className="fa-solid fa-money-bill-transfer text-primary mr-2" />
                          <span className="text-sm font-medium text-text-primary break-words">
                            {entry.label}
                          </span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.currency}
                        </span>
                      </div>
                      <div>
                        <span className={`text-sm font-semibold ${amountClass}`}>
                          {formatCurrency(signedAmount, entry.currency)}
                        </span>
                        {entry.originalCurrency && entry.originalAmount ? (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(entry.originalAmount, entry.originalCurrency)}{' '}
                            {entry.originalCurrency}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-text-primary">Contraparte:</span>{' '}
                        {entry.contact || 'Múltiples clientes'}
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white">
                          <i className="fa-solid fa-check mr-1" />
                          Registrado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden sm:block bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuenta afectada
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Moneda
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contraparte
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summary.entries.map((entry, index) => {
                        const signedAmount = entry.amount === 0 ? 0 : entry.amount * entry.sign;
                        const amountClass = entry.sign === 1 ? 'text-success' : 'text-danger';
                        return (
                          <tr key={`${entry.label}-${index}`}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <i className="fa-solid fa-money-bill-transfer text-primary mr-2" />
                                <span className="text-sm font-medium text-text-primary">{entry.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {entry.currency}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-sm font-bold ${amountClass}`}>
                                {formatCurrency(signedAmount, entry.currency)}
                              </span>
                              {entry.originalCurrency && entry.originalAmount ? (
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(entry.originalAmount, entry.originalCurrency)}{' '}
                                  {entry.originalCurrency}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm text-gray-600">
                                {entry.contact || 'Múltiples clientes'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success text-white">
                                <i className="fa-solid fa-check mr-1" />
                                Registrado
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Explanation Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-info-circle text-primary mt-1" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Principio de partida doble</h4>
                  <p className="text-sm text-gray-600">
                    Cada operación genera dos movimientos compensatorios (principio de partida doble). Los saldos afectados se actualizan instantáneamente en Tesorería y Cuentas Corrientes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/dashboard/tesoreria');
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-coins mr-2" />
              Ver en Tesorería
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <i className="fa-solid fa-times mr-2" />
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};
