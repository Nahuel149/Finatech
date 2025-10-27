import React from 'react';

interface AccountingEntry {
  account: string;
  currency: string;
  amount: number;
  counterpart?: string | null;
}

interface AccountingImpactCardProps {
  entries: AccountingEntry[];
}

const amountClass = (amount: number) => (amount >= 0 ? 'positive-amount' : 'negative-amount');

const formatAmount = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
};

export const AccountingImpactCard: React.FC<AccountingImpactCardProps> = ({ entries }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <h4 className="text-lg font-semibold text-text-primary mb-4">Impacto contable</h4>

    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Moneda
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Monto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Contrapartida
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr key={`${entry.account}-${index}`}>
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.account}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {entry.currency}
                </span>
              </td>
              <td className={`px-4 py-3 text-right text-sm font-semibold ${amountClass(entry.amount)}`}>
                {formatAmount(entry.amount, entry.currency)}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">{entry.counterpart || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <div className="flex items-start">
        <i className="fa-solid fa-info-circle text-blue-600 mr-2 mt-0.5" />
        <div className="text-sm text-blue-800">
          Cada movimiento genera dos registros compensatorios (principio de partida doble).
        </div>
      </div>
    </div>
  </div>
);
