const { getAddressPredictions } = require('../services/geocoding.service');

const autocomplete = async (req, res, next) => {
  try {
    const { input = '' } = req.query;
    const result = await getAddressPredictions(String(input || ''));

    res.json({
      predictions: result.predictions,
      source: result.source,
      isFallback: result.isFallback,
      warning: result.warning || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  autocomplete,
};
