const { geocodeAddress } = require('./locationiq.service');

const STATIC_ADDRESSES = [
  {
    description: 'Av. Corrientes 1234, Buenos Aires, Argentina',
    placeId: 'static-corrientes-1234',
  },
  {
    description: 'Av. Santa Fe 4321, Buenos Aires, Argentina',
    placeId: 'static-santafe-4321',
  },
  {
    description: 'Calle Florida 750, Buenos Aires, Argentina',
    placeId: 'static-florida-750',
  },
  {
    description: 'Bv. Oroño 1500, Rosario, Argentina',
    placeId: 'static-orono-1500',
  },
  {
    description: 'Av. Colón 800, Córdoba, Argentina',
    placeId: 'static-colon-800',
  },
];

const toStructuredPrediction = (prediction) => ({
  description: prediction.description,
  placeId: prediction.place_id || prediction.placeId,
  structuredFormatting: prediction.structured_formatting || null,
  terms: prediction.terms || null,
});

const getFallbackPredictions = (input) => {
  const query = input.trim().toLowerCase();
  if (!query) {
    return [];
  }

  return STATIC_ADDRESSES.filter((item) => item.description.toLowerCase().includes(query))
    .slice(0, 5)
    .map((item) => ({
      description: item.description,
      placeId: item.placeId,
      structuredFormatting: null,
      terms: null,
    }));
};

const callLocationIqApi = async (input) => {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) return null;

  const results = await geocodeAddress(input, {
    countrycodes: process.env.LOCATIONIQ_COUNTRY_CODES || 'ar',
    limit: 5,
  });

  return {
    predictions: results.map((item) => ({
      description: item.displayName,
      placeId: item.address?.place_id || item.placeId || `${item.lat},${item.lon}`,
      structuredFormatting: null,
      terms: null,
    })),
    source: 'locationiq',
    isFallback: false,
  };
};

const callPlacesApi = async (input) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (typeof fetch !== 'function') {
    throw Object.assign(new Error('Fetch API not available in this runtime'), { status: 503 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', input);
  url.searchParams.set('types', 'address');
  url.searchParams.set('language', 'es');
  url.searchParams.set('components', 'country:ar');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw Object.assign(new Error('No se pudo contactar con Google Maps'), { status: 503 });
  }

  const payload = await response.json();
  const status = payload.status || 'UNKNOWN';

  if (status === 'ZERO_RESULTS') {
    return { predictions: [], source: 'google', isFallback: false };
  }

  if (status !== 'OK') {
    if (status === 'REQUEST_DENIED' || status === 'INVALID_REQUEST') {
      return {
        predictions: getFallbackPredictions(input),
        source: 'static',
        isFallback: true,
        warning: payload.error_message || 'Google Maps rechazó la solicitud.',
      };
    }

    throw Object.assign(new Error(payload.error_message || 'Google Maps devolvió un error'), {
      status: 503,
      details: { status },
    });
  }

  return {
    predictions: (payload.predictions || []).map(toStructuredPrediction),
    source: 'google',
    isFallback: false,
  };
};

const getAddressPredictions = async (input) => {
  if (!input || !input.toString().trim()) {
    return { predictions: [], source: 'static', isFallback: true };
  }

  if (input.trim().length < 3) {
    return { predictions: [], source: 'static', isFallback: true };
  }

  // Prefer LocationIQ when available, then Google, finally static list
  try {
    const locationIqResult = await callLocationIqApi(input.trim());
    if (locationIqResult) {
      return locationIqResult;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('LocationIQ autocomplete failed, falling back to Google/static', error.message);
  }

  const googleResult = await callPlacesApi(input.trim());
  if (googleResult) {
    return googleResult;
  }

  return {
    predictions: getFallbackPredictions(input),
    source: 'static',
    isFallback: true,
  };
};

module.exports = {
  getAddressPredictions,
};
