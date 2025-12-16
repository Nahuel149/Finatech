const axios = require('axios');
const MarketRateOverride = require('../models/MarketRateOverride');

const saveManualMarketRate = async ({
  baseAsset,
  quoteAsset,
  rate,
  buyRate,
  sellRate,
  selectedSide = 'sell',
  validFrom,
  userId,
  source = 'MANUAL',
}) => {
  const normalizedBase = String(baseAsset || '').toUpperCase();
  const normalizedQuote = String(quoteAsset || '').toUpperCase();
  const numericRate = Number(rate);
  const numericBuy = Number(buyRate);
  const numericSell = Number(sellRate);
  const validFromDate = validFrom ? new Date(validFrom) : new Date();
  const normalizedSelected = selectedSide === 'buy' ? 'buy' : 'sell';

  if (!normalizedBase || !normalizedQuote) {
    throw new Error('Indicá los activos base y contra los que se cotiza.');
  }

  const hasAnyRate =
    (Number.isFinite(numericRate) && numericRate > 0) ||
    (Number.isFinite(numericBuy) && numericBuy > 0) ||
    (Number.isFinite(numericSell) && numericSell > 0);

  if (!hasAnyRate) {
    throw new Error('Ingresá una tasa válida.');
  }
  if (Number.isNaN(validFromDate.getTime())) {
    throw new Error('La fecha de vigencia es inválida.');
  }

  const resolvedRate =
    normalizedSelected === 'buy'
      ? (Number.isFinite(numericBuy) && numericBuy > 0 ? numericBuy : null)
      : (Number.isFinite(numericSell) && numericSell > 0 ? numericSell : null);

  if (normalizedSelected === 'buy' && !resolvedRate) {
    throw new Error('Debés indicar el valor de compra para publicarlo.');
  }
  if (normalizedSelected === 'sell' && !resolvedRate) {
    throw new Error('Debés indicar el valor de venta para publicarlo.');
  }

  const finalRate =
    resolvedRate ||
    (Number.isFinite(numericRate) && numericRate > 0 ? numericRate : null) ||
    (Number.isFinite(numericBuy) && numericBuy > 0 ? numericBuy : null) ||
    (Number.isFinite(numericSell) && numericSell > 0 ? numericSell : null);

  if (!finalRate) {
    throw new Error('No pudimos resolver la tasa seleccionada.');
  }

  const override = await MarketRateOverride.create({
    baseAsset: normalizedBase,
    quoteAsset: normalizedQuote,
    rate: finalRate,
    buyRate: Number.isFinite(numericBuy) && numericBuy > 0 ? numericBuy : undefined,
    sellRate: Number.isFinite(numericSell) && numericSell > 0 ? numericSell : undefined,
    selectedSide: normalizedSelected,
    validFrom: validFromDate,
    source,
    user: userId || null,
  });

  return override.toObject();
};

const getLatestMarketRate = async ({ baseAsset, quoteAsset }) => {
  const normalizedBase = String(baseAsset || '').toUpperCase();
  const normalizedQuote = String(quoteAsset || '').toUpperCase();

  if (!normalizedBase || !normalizedQuote) {
    throw new Error('Indicá los activos base y contra los que se cotiza.');
  }

  const override = await MarketRateOverride.findOne({
    baseAsset: normalizedBase,
    quoteAsset: normalizedQuote,
  })
    .sort({ validFrom: -1, createdAt: -1 })
    .lean();

  if (!override) {
    return null;
  }

  return {
    baseAsset: override.baseAsset,
    quoteAsset: override.quoteAsset,
    rate: override.rate,
    buyRate: override.buyRate ?? null,
    sellRate: override.sellRate ?? null,
    selectedSide: override.selectedSide || 'sell',
    validFrom: override.validFrom,
    source: override.source,
    createdAt: override.createdAt,
  };
};

const normalizeNumber = (value) => {
  if (!value) return null;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchOfficialUsdArsRate = async () => {
  const response = await axios.get('https://dolarhoy.com', {
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinatechBot/1.0; +https://finatech.local)',
    },
  });

  const html = response?.data || '';
  const officialMatch =
    html.match(/D[óÓ]LAR OFICIAL[\s\S]{0,800}?(\$[\s\d.,]+)[\s\S]{0,40}?(\$[\s\d.,]+)/i) ||
    html.match(/dolar oficial[\s\S]{0,800}?(\$[\s\d.,]+)[\s\S]{0,40}?(\$[\s\d.,]+)/i);

  if (!officialMatch) {
    throw new Error('No pudimos leer la cotización oficial desde dolarhoy.com');
  }

  const buyRaw = officialMatch[1];
  const sellRaw = officialMatch[2];
  const buyRate = normalizeNumber(buyRaw);
  const sellRate = normalizeNumber(sellRaw);

  if (!buyRate || !sellRate) {
    throw new Error('La respuesta de dolarhoy.com no tiene valores válidos.');
  }

  return {
    baseAsset: 'USD',
    quoteAsset: 'ARS',
    buyRate,
    sellRate,
    source: 'dolarhoy',
    fetchedAt: new Date().toISOString(),
  };
};

module.exports = {
  saveManualMarketRate,
  getLatestMarketRate,
  fetchOfficialUsdArsRate,
};
