const { geocodeAddress } = require('../services/locationiq.service');

const geocode = async (req, res, next) => {
  try {
    const { query = '', countrycodes = 'ar', limit } = req.query;
    const numericLimit = Number(limit);
    const safeLimit = Number.isFinite(numericLimit)
      ? Math.min(Math.max(numericLimit, 1), 10)
      : 5;

    const results = await geocodeAddress(query, {
      countrycodes: String(countrycodes || 'ar'),
      limit: safeLimit,
    });

    res.json({ results });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  geocode,
};
