const MarketRateOverride = require('../models/MarketRateOverride');

const saveManualMarketRate = async ({ baseAsset, quoteAsset, rate, validFrom, userId }) => {
  const normalizedBase = String(baseAsset || '').toUpperCase();
  const normalizedQuote = String(quoteAsset || '').toUpperCase();
  const numericRate = Number(rate);
  const validFromDate = validFrom ? new Date(validFrom) : new Date();

  if (!normalizedBase || !normalizedQuote) {
    throw new Error('Indicá los activos base y contra los que se cotiza.');
  }
  if (!Number.isFinite(numericRate) || numericRate <= 0) {
    throw new Error('Ingresá una tasa válida.');
  }
  if (Number.isNaN(validFromDate.getTime())) {
    throw new Error('La fecha de vigencia es inválida.');
  }

  const override = await MarketRateOverride.create({
    baseAsset: normalizedBase,
    quoteAsset: normalizedQuote,
    rate: numericRate,
    validFrom: validFromDate,
    source: 'MANUAL',
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
    validFrom: override.validFrom,
    source: override.source,
    createdAt: override.createdAt,
  };
};

module.exports = {
  saveManualMarketRate,
  getLatestMarketRate,
};
