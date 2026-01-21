import React from 'react';
import { TreasuryLinkedBalanceSummaryEntry } from '../../../../types/treasury';

interface Props {
  balances: TreasuryLinkedBalanceSummaryEntry[];
  loading: boolean;
  onViewInAccounts: (balanceId: string) => void;
}

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const stateBadge = (state: string) => {
  switch (state) {
    case 'activo':
      return { className: 'bg-green-100 text-green-800', label: 'Activo' };
    case 'inactivo':
      return { className: 'bg-yellow-100 text-yellow-800', label: 'Inactivo' };
    case 'sin_movimientos':
    default:
      return { className: 'bg-gray-100 text-gray-800', label: 'Sin movimientos' };
  }
};

const currencyBadgeClass = (currency: string) =>
  currency === 'USD' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800';

const AccountingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {Array.from({ length: 6 }).map((_, index) => (
            <th
              key={`accounting-head-${index}`}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: 3 }).map((_, rowIndex) => (
          <tr key={`accounting-row-${rowIndex}`}>
            {Array.from({ length: 6 }).map((__, colIndex) => (
              <td key={`accounting-cell-${rowIndex}-${colIndex}`} className="px-6 py-4">
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const LinkedBalancesAccountingSection: React.FC<Props> = ({
  balances,
  loading,
  onViewInAccounts,
}) => {
  const rows = balances
    .filter((balance) => balance.accounting)
    .map((balance) => ({
      balanceId: balance.id,
      label: balance.accounting?.accountName || balance.label,
      currency: balance.accounting?.currency || balance.currency,
      amount: balance.accounting?.balance ?? balance.amount,
      lastOperationAt: balance.accounting?.lastOperationAt || null,
      state: balance.accounting?.state || 'sin_movimientos',
    }));

  return (
    <section id="accounting-accounts-section" className="mb-10 lg:mb-12">
      <h2 className="text-lg font-semibold text-text-primary mb-6 lg:mb-8">Integración contable</h2>

      {loading && <AccountingSkeleton />}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuenta contable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moneda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última operación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length ? (
                rows.map((row) => {
                  const badge = stateBadge(row.state);
                  return (
                    <tr key={row.balanceId}>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">{row.label}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${currencyBadgeClass(
                            row.currency
                          )}`}
                        >
                          {row.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-success">
                        {formatAmount(row.amount, row.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-primary">
                        {formatDateTime(row.lastOperationAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => onViewInAccounts(row.balanceId)}
                          className="text-primary hover:text-blue-700 text-sm"
                        >
                          Ver en CC
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-600">
                    No hay información contable disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
