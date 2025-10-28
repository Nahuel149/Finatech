import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TransferOperation } from '../../../../types';
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-40 backdrop blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-xl h-full bg-white shadow-xl border-l border-gray-200 transform transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <header className="px-6 py-5 border-b border-gray-200 flex items-start justify-between bg-white">
            <div>
              <span className="text-xs uppercase text-gray-500 tracking-wide">
                Impacto contable
              </span>
              <h2 className="text-xl font-semibold text-text-primary mt-1">
                {operation.operationCode || operation.id}
              </h2>
              <div className="text-sm text-gray-500 mt-1">
                Registrado {formatDateTime(summary.timestamp)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-times text-xl" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <i className="fa-solid fa-scale-balanced text-primary mr-2" />
                Movimientos generados
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuenta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moneda
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.entries.map((entry, index) => {
                      const signedAmount = entry.amount === 0 ? 0 : entry.amount * entry.sign;
                      const amountClass = entry.sign === 1 ? 'text-success' : 'text-danger';
                      return (
                        <tr
                          key={`${entry.label}-${index}`}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="px-4 py-4 text-sm text-text-primary">{entry.label}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {entry.currency}
                            </span>
                          </td>
                          <td className={`px-4 py-4 text-sm font-semibold ${amountClass}`}>
                            {formatCurrency(signedAmount, entry.currency)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {entry.contact || '—'}
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
            </section>

            <section>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start">
                <i className="fa-solid fa-info-circle text-primary mt-1 mr-3" />
                <div className="text-sm text-gray-600">
                  Cada movimiento compensa la cuenta corriente del contacto y actualiza
                  automáticamente los saldos de Tesorería. Encontrarás esta operación en el módulo
                  Tesorería y en Cuentas Corrientes.
                </div>
              </div>
            </section>
          </div>

          <footer className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/dashboard/tesoreria');
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <i className="fa-solid fa-vault mr-2" />
              Ver en Tesorería
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
