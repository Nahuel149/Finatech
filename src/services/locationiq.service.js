const axios = require('axios');

const LOCATIONIQ_BASE_URL =
  process.env.LOCATIONIQ_BASE_URL || 'https://us1.locationiq.com/v1/search.php';

const normalizeResult = (item = {}) => ({
  displayName: item.display_name || '',
  lat: Number(item.lat),
  lon: Number(item.lon),
  type: item.type || item.class || 'unknown',
  address: item.address || null,
});

const geocodeAddress = async (query, { countrycodes = 'ar', limit = 5 } = {}) => {
  const trimmed = String(query || '').trim();

  if (!trimmed) {
    const error = new Error('La consulta de dirección es requerida.');
    error.status = 400;
    throw error;
  }

  const apiKey = process.env.LOCATIONIQ_API_KEY;

  if (!apiKey) {
    const error = new Error('LocationIQ no está configurado en el servidor.');
    error.status = 500;
    throw error;
  }

  try {
    const response = await axios.get(LOCATIONIQ_BASE_URL, {
      params: {
        key: apiKey,
        q: trimmed,
        format: 'json',
        countrycodes,
        limit,
      },
      timeout: 8000,
    });

    const payload = Array.isArray(response.data) ? response.data : [];
    return payload.map(normalizeResult);
  } catch (error) {
    const status = error.response?.status || 502;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'No pudimos contactar con LocationIQ.';

    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.details = {
      upstream: 'locationiq',
      status,
      message: error.message,
    };
    throw wrapped;
  }
};

module.exports = {
  geocodeAddress,
};
