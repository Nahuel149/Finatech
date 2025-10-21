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

const callPlacesApi = async (input) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      predictions: getFallbackPredictions(input),
      source: 'static',
      isFallback: true,
    };
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

  return callPlacesApi(input.trim());
};

module.exports = {
  getAddressPredictions,
};
