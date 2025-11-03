import React from 'react';
import {
  TreasuryContactBalanceSummary,
  TreasuryContactCurrencyTotals,
} from '../../../../types';

interface Props {
  contact: {
    fullName: string;
    shortName: string;
    contactType: string;
    cuit: string | null;
    updatedAt: string | null;
  };
  summary: TreasuryContactBalanceSummary;
  totalsByCurrency: TreasuryContactCurrencyTotals[];
  onViewInAccounts: () => void;
}

const CONTACT_TYPE_LABEL: Record<string, string> = {
  client: 'Cliente',
  provider: 'Proveedor',
};

const formatAmount = (amount: number, currency: string) => {
  const normalized = String(currency || 'ARS').toUpperCase();
  const isUsd = normalized === 'USD';
  const formatter = new Intl.NumberFormat(isUsd ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: isUsd ? 'USD' : 'ARS',
    minimumFractionDigits: 2,
  });
  const formatted = formatter.format(amount);
  if (isUsd) {
    return formatted.replace('US$', 'USD').trim();
  }
  return formatted.replace('AR$', '$').replace('ARS', '$').trim();
};

const amountToneClass = (amount: number) => {
  if (amount > 0) return 'positive-amount';
  if (amount < 0) return 'negative-amount';
  return 'neutral-amount';
};

const formatTimestamp = (iso: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const variationText = (
  variation: TreasuryContactBalanceSummary['variation'],
  currency: string
) => {
  if (!variation) {
    return {
      icon: 'fa-minus',
      className: 'text-neutral-amount',
      text: 'Sin variación disponible',
    };
  }

  const { percentage, direction } = variation;
  const prefix = percentage > 0 ? '+' : '';
  const formatted = `${prefix}${percentage.toFixed(1)}% vs período anterior`;

  if (direction === 'up') {
    return {
      icon: 'fa-arrow-up',
      className: 'text-success',
      text: formatted,
    };
  }
  if (direction === 'down') {
    return {
      icon: 'fa-arrow-down',
      className: 'text-danger',
      text: formatted,
    };
  }
  return {
    icon: 'fa-minus',
    className: 'text-neutral-amount',
    text: formatted,
  };
};

export const ContactSummaryCard: React.FC<Props> = ({
  contact,
  summary,
  totalsByCurrency,
  onViewInAccounts,
}) => {
  const contactLabel = CONTACT_TYPE_LABEL[contact.contactType] || contact.contactType;
  const variationMeta = variationText(summary.variation, summary.balance.currency);

  const currencyTotals: TreasuryContactCurrencyTotals[] = (() => {
    if (totalsByCurrency && totalsByCurrency.length) {
      return totalsByCurrency;
    }
    if (summary.totalsByCurrency && summary.totalsByCurrency.length) {
      return summary.totalsByCurrency;
    }
    return [
      {
        currency: summary.balance.currency,
        balance: summary.balance.amount,
        totals: {
          incoming: summary.totals.incoming,
          outgoing: summary.totals.outgoing,
          net: summary.totals.net,
        },
      },
    ];
  })();

  const primaryEntry =
    currencyTotals.find((entry) => entry.currency === summary.balance.currency) ||
    currencyTotals[0];
  const otherEntries = currencyTotals.filter((entry) => entry !== primaryEntry);

  return (
    <section
      id="contact-summary"
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div id="contact-info" className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <i className="fa-solid fa-user text-white text-2xl" />
          </div>
          <div>
            <div className="text-xl font-semibold text-text-primary mb-1">
              {contact.fullName}
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {contactLabel}
              </span>
              {contact.cuit && <span className="text-sm text-gray-600">{contact.cuit}</span>}
            </div>
            <div className="text-xs text-gray-500">
              Actualizado {formatTimestamp(contact.updatedAt)}
            </div>
          </div>
        </div>

        <div id="current-balance" className="text-center">
          <div className="text-sm text-gray-600 mb-1">Saldo total actual</div>
          <div className={`text-4xl font-bold ${amountToneClass(primaryEntry.balance)} mb-2`}>
            {formatAmount(primaryEntry.balance, primaryEntry.currency)}
          </div>
          {otherEntries.length > 0 && (
            <div className="space-y-1 text-sm text-gray-600">
              {otherEntries.map((entry) => (
                <div key={entry.currency}>
                  {formatAmount(entry.balance, entry.currency)}
                </div>
              ))}
            </div>
          )}
          <div className={`flex items-center justify-center space-x-2 ${variationMeta.className}`}>
            <i className={`fa-solid ${variationMeta.icon}`} />
            <span className="font-medium">{variationMeta.text}</span>
          </div>
        </div>

        <div id="operation-totals" className="space-y-4">
          {currencyTotals.map((entry) => (
            <div
              key={entry.currency}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  Operaciones en {entry.currency}
                </span>
                <span className={`text-sm font-semibold ${amountToneClass(entry.balance)}`}>
                  {formatAmount(entry.balance, entry.currency)}
                </span>
              </div>
              <div className="flex justify-between items-start text-sm mb-2">
                <div>
                  <div className="text-gray-600">Entrantes</div>
                  <div className="font-semibold incoming">
                    {formatAmount(entry.totals.incoming.amount, entry.currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.totals.incoming.count} operaciones
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-600">Salientes</div>
                  <div className="font-semibold outgoing">
                    {formatAmount(entry.totals.outgoing.amount, entry.currency)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.totals.outgoing.count} operaciones
                  </div>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Saldo neto</span>
                <span className={`font-bold ${amountToneClass(entry.totals.net)}`}>
                  {formatAmount(entry.totals.net, entry.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currencyTotals.length > 1 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          {currencyTotals.map((entry) => (
            <div
              key={entry.currency}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            >
              <span>{`Saldo en ${entry.currency}`}</span>
              <span className="font-medium text-text-primary">
                {formatAmount(entry.balance, entry.currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
        <button
          type="button"
          onClick={onViewInAccounts}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <i className="fa-solid fa-external-link mr-2" />
          Ver en Cuentas Corrientes
        </button>
      </div>
    </section>
  );
};
