type TreasuryAccountLabelInput = {
  key?: string | null;
  optionLabel?: string | null;
};

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const titleCurrency = (value: string) => value.toUpperCase();

// Converts internal account keys (e.g. "cash-ars") into user-facing Spanish labels.
export const formatTreasuryAccountLabel = ({ key, optionLabel }: TreasuryAccountLabelInput) => {
  if (optionLabel && normalize(optionLabel) !== normalize(key)) {
    return optionLabel;
  }

  const normalizedKey = normalize(key);
  if (!normalizedKey) {
    return '';
  }

  // Common legacy keys.
  if (normalizedKey === 'cash') return 'Efectivo';
  if (normalizedKey === 'transfers') return 'Transferencias';
  if (normalizedKey === 'usd' || normalizedKey === 'cash_usd') return 'Caja (USD)';
  if (normalizedKey === 'courier_in_transit') return 'Mensajero en tránsito';

  // Keys like "cash-ars", "transfers-ars", "usd-usd".
  const parts = normalizedKey.split('-').filter(Boolean);
  if (parts.length >= 2) {
    const base = parts[0];
    const currency = titleCurrency(parts[parts.length - 1]);

    if (base === 'cash') return `Efectivo (${currency})`;
    if (base === 'transfers') return `Transferencias (${currency})`;
    if (base === 'usd') return `Caja (${currency})`;
  }

  // Fallback: show the raw key (better than showing empty).
  return key || '';
};

