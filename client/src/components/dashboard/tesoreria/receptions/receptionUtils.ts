import { TreasuryReception } from '../../../../types/treasuryReceptions';

export const receptionStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'omitted':
      return 'Omitida';
    case 'reverted':
      return 'Revertida';
    default:
      return status;
  }
};

export const receptionStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'omitted':
      return 'bg-blue-100 text-blue-800';
    case 'reverted':
      return 'bg-gray-200 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const describeAssetType = (type: string | undefined) => {
  switch (type) {
    case 'CURRENCY':
      return 'Efectivo';
    case 'CHEQUE':
      return 'Cheques';
    case 'METAL':
      return 'Metales preciosos';
    default:
      return type || 'Otro valor';
  }
};

export const summarizeAssetTypes = (reception: TreasuryReception) => {
  const types = new Set((reception.items || []).map((item) => item.assetType));
  if (!types.size) {
    return 'Sin ítems registrados';
  }
  if (types.size === 1) {
    const [only] = Array.from(types);
    return describeAssetType(only);
  }
  return `${types.size} tipos de valores`;
};

export const ensureCurrencyTotals = (reception: TreasuryReception) => {
  if (Array.isArray(reception.currencyTotals) && reception.currencyTotals.length) {
    return reception.currencyTotals;
  }
  const aggregates = new Map<string, { expected: number; received: number; pending: number }>();
  (reception.items || []).forEach((item) => {
    const currency = item.currency || 'ARS';
    const current = aggregates.get(currency) || { expected: 0, received: 0, pending: 0 };
    current.expected += item.expectedAmount || 0;
    current.received += item.receivedAmount || 0;
    current.pending += item.pendingAmount || 0;
    aggregates.set(currency, current);
  });
  return Array.from(aggregates.entries()).map(([currency, totals]) => ({
    currency,
    expectedAmount: totals.expected,
    receivedAmount: totals.received,
    pendingAmount: totals.pending,
  }));
};
