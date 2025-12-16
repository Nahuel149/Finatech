const axios = require('axios');
const MarketRateOverride = require('../models/MarketRateOverride');

const saveManualMarketRate = async ({
  baseAsset,
  quoteAsset,
  buyRate,
  sellRate,
  userId,
  source = 'MANUAL',
}) => {
  const normalizedBase = String(baseAsset || '').toUpperCase();
  const normalizedQuote = String(quoteAsset || '').toUpperCase();
  const numericBuy = Number(buyRate);
  const numericSell = Number(sellRate);

  if (!normalizedBase || !normalizedQuote) {
    throw new Error('Indica los activos base y de referencia.');
  }

  const hasValidBuy = Number.isFinite(numericBuy) && numericBuy > 0;
  const hasValidSell = Number.isFinite(numericSell) && numericSell > 0;
  if (!hasValidBuy || !hasValidSell) {
    throw new Error('Debes indicar precios de compra y venta mayores a 0.');
  }

  const override = await MarketRateOverride.create({
    baseAsset: normalizedBase,
    quoteAsset: normalizedQuote,
    rate: numericSell, // publish sell by default for compatibility
    buyRate: numericBuy,
    sellRate: numericSell,
    selectedSide: 'sell',
    validFrom: new Date(),
    source,
    user: userId || null,
  });

  return override.toObject();
};

const getLatestMarketRate = async ({ baseAsset, quoteAsset }) => {
  const normalizedBase = String(baseAsset || '').toUpperCase();
  const normalizedQuote = String(quoteAsset || '').toUpperCase();

  if (!normalizedBase || !normalizedQuote) {
    throw new Error('Indica los activos base y de referencia.');
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
  if (!value && value !== 0) return null;
  const cleaned = String(value).replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchFromDolarHoy = async () => {
  const response = await axios.get('https://dolarhoy.com', {
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinatechBot/1.0; +https://finatech.local)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const html = response?.data || '';
  const officialMatch =
    html.match(/D[���"]LAR OFICIAL[\s\S]{0,800}?(\$[\s\d.,]+)[\s\S]{0,40}?(\$[\s\d.,]+)/i) ||
    html.match(/dolar oficial[\s\S]{0,800}?(\$[\s\d.,]+)[\s\S]{0,40}?(\$[\s\d.,]+)/i) ||
    html.match(/oficial[\s\S]{0,500}?compra[^\d$]*([\$\s\d.,]+)[\s\S]{0,120}?venta[^\d$]*([\$\s\d.,]+)/i);

  if (!officialMatch) {
    throw new Error('No pudimos leer la cotizacion oficial desde dolarhoy.com');
  }

  const buyRate = normalizeNumber(officialMatch[1]);
  const sellRate = normalizeNumber(officialMatch[2]);

  if (!buyRate || !sellRate) {
    throw new Error('La respuesta de dolarhoy.com no tiene valores validos.');
  }

  return { buyRate, sellRate, source: 'dolarhoy' };
};

const fetchFromDolarApi = async () => {
  const response = await axios.get('https://dolarapi.com/v1/dolares/oficial', {
    timeout: 6000,
  });
  const buyRate = normalizeNumber(response?.data?.compra);
  const sellRate = normalizeNumber(response?.data?.venta);
  if (!buyRate || !sellRate) {
    throw new Error('Respuesta incompleta de dolarapi.com');
  }
  return { buyRate, sellRate, source: 'dolarapi' };
};

const fetchOfficialUsdArsRate = async () => {
  const attempts = [fetchFromDolarHoy, fetchFromDolarApi];
  const errors = [];

  for (const attempt of attempts) {
    try {
      const { buyRate, sellRate, source } = await attempt();
      return {
        baseAsset: 'USD',
        quoteAsset: 'ARS',
        buyRate,
        sellRate,
        source,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(error);
    }
  }

  const lastError = errors[errors.length - 1];
  const serviceError = new Error(
    lastError?.message || 'No pudimos leer la cotizacion oficial desde los proveedores.'
  );
  serviceError.status = 502;
  throw serviceError;
};

module.exports = {
  saveManualMarketRate,
  getLatestMarketRate,
  fetchOfficialUsdArsRate,
};
