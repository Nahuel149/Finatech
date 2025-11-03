import { TransferOperation } from '../../../../types';

export const formatCurrency = (amount: number, currency: string = 'ARS') =>
  new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatDateTime = (iso?: string | null) => {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const TREASURY_LABEL: Record<TransferOperation['movementType'], string> = {
  transfer: 'Transferencias ARS',
  cash: 'Caja ARS',
};

const ACCOUNT_LABEL: Record<string, string> = {
  ARS: 'Cuentas a Cobrar ARS',
  USD: 'Cuentas a Cobrar USD',
};

export type AccountingSummaryEntry = {
  label: string;
  currency: string;
  amount: number;
  sign: 1 | -1;
  contact: string | null;
  originalAmount?: number;
  originalCurrency?: string | null;
};

export const buildAccountingEntries = (operation: TransferOperation): AccountingSummaryEntry[] => {
  if (!operation) {
    return [];
  }

  const treasurySign: 1 | -1 = operation.direction === 'incoming' ? 1 : -1;
  const counterpartySign: 1 | -1 = treasurySign === 1 ? -1 : 1;
  const entries: AccountingSummaryEntry[] = [
    {
      label: TREASURY_LABEL[operation.movementType] || 'Tesorería',
      currency: 'ARS',
      amount: operation.totalAmount,
      sign: treasurySign,
      contact: null,
    },
  ];

  operation.distributionLines.forEach((line) => {
    entries.push({
      label: ACCOUNT_LABEL[line.method] || `Cuentas a Cobrar ${line.method}`,
      currency: 'ARS',
      amount: line.amountArs ?? line.amount,
      sign: counterpartySign,
      contact: line.contactName || null,
      originalAmount: line.method === 'USD' ? line.amount : undefined,
      originalCurrency: line.method === 'USD' ? 'USD' : undefined,
    });
  });

  return entries;
};
