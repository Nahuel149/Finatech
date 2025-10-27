import React from 'react';
import { useDashboardBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';

const formatTime = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatAmount = (amount: number, currency: string) => {
  const locale = currency === 'USD' ? 'en-US' : 'es-AR';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};

const statusDotClass = (status?: string) => {
  switch (status) {
    case 'ok':
      return 'bg-success';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-danger';
    default:
      return 'bg-gray-300';
  }
};

const iconForBalance = (label?: string, currency?: string) => {
  if (label?.toLowerCase().includes('transfer')) return 'fa-money-bill-transfer';
  if (label?.toLowerCase().includes('efectivo')) return 'fa-hand-holding-dollar';
  if (currency === 'USD') return 'fa-dollar-sign';
  return 'fa-wallet';
};

export const BalanceStripe: React.FC = () => {
  const { balances, loading, error, refresh } = useDashboardBalances();

  return (
    <div id="balance-stripe" className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-6">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 w-32 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="h-6 w-40 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse mb-1" />
                  <div className="h-3 w-24 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                </div>
              ))}
            </>
          )}

          {!loading && !error && balances.map((b: TreasuryBalance) => (
            <div key={b.id} id={`balance-${b.id}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <i className={`fa-solid ${iconForBalance(b.label, b.currency)} text-primary mr-2`}></i>
                  <span className="text-sm font-medium text-gray-600">{b.label} ({b.currency})</span>
                </div>
                <div className={`w-2 h-2 ${statusDotClass(b.status)} rounded-full`}></div>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">{formatAmount(b.amount, b.currency)}</div>
              <div className="text-xs text-gray-500">Actualizado {formatTime(b.updatedAt)}</div>
            </div>
          ))}

          {!loading && error && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <i className="fa-solid fa-wallet text-primary mr-2"></i>
                      <span className="text-sm font-medium text-gray-600">Balance</span>
                    </div>
                    <div className="w-2 h-2 bg-danger rounded-full"></div>
                  </div>
                  <div className="text-2xl font-bold text-text-primary mb-1">—</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">Error conexión</div>
                    <button onClick={() => refresh()} className="text-xs text-primary hover:underline">Reintentar</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};