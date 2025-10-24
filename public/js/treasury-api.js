(function attachTreasuryApi(global) {
  const JSON_MIME = 'application/json';
  const CSRF_COOKIE_NAME = 'finatech_csrf';

  const getCookie = (name) => {
    try {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`));
      return match ? decodeURIComponent(match.split('=')[1]) : null;
    } catch (_) {
      return null;
    }
  };

  class TreasuryApiError extends Error {
    constructor(message, status, payload, cause) {
      super(message);
      this.name = 'TreasuryApiError';
      this.status = status;
      this.payload = payload;
      if (cause) {
        this.cause = cause;
      }
    }

    isUnauthorized() {
      return this.status === 401 || this.status === 403;
    }
  }

  const buildQueryString = (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            search.append(key, item);
          }
        });
        return;
      }
      search.append(key, value);
    });
    const query = search.toString();
    return query ? `?${query}` : '';
  };

  const safeJsonStringify = (value) => {
    try {
      return JSON.stringify(value);
    } catch (error) {
      throw new TreasuryApiError('No se pudo preparar la solicitud.', 0, null, error);
    }
  };

  const resolveApiUrl = (path) => {
    try {
      if (typeof path !== 'string') return path;
      if (/^https?:\/\//i.test(path)) return path;
      const base = (global.API_BASE_URL || '').trim();
      if (!base) return path;
      if (path.startsWith('/')) return `${base}${path}`;
      return `${base}/${path}`;
    } catch (_) {
      return path;
    }
  };

  const request = async (input, { method = 'GET', body, headers = {}, signal } = {}) => {
    const finalHeaders = new Headers(headers);
    const options = {
      method,
      credentials: 'include',
      headers: finalHeaders,
      signal,
    };

    if (body !== undefined && body !== null) {
      if (typeof body === 'string' || body instanceof FormData) {
        options.body = body;
      } else {
        if (!finalHeaders.has('Content-Type')) {
          finalHeaders.set('Content-Type', JSON_MIME);
        }
        options.body = safeJsonStringify(body);
      }
    }

    // Attach CSRF token for state-changing requests if not provided
    const methodUpper = String(method || 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(methodUpper)) {
      if (!finalHeaders.has('X-CSRF-Token')) {
        const csrfToken = getCookie(CSRF_COOKIE_NAME);
        if (csrfToken) {
          finalHeaders.set('X-CSRF-Token', csrfToken);
        }
      }
    }

    let response;
    try {
      response = await fetch(resolveApiUrl(input), options);
    } catch (error) {
      throw new TreasuryApiError('No se pudo conectar con el servidor.', 0, null, error);
    }

    let data = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch (error) {
        // ignore parsing errors for empty responses
      }
    }

    if (!response.ok) {
      const message =
        (data && (data.message || data.error || data.title)) ||
        (response.status === 403
          ? 'No tenés permisos para acceder a Tesorería.'
          : 'Ocurrió un error al procesar la solicitud.');
      throw new TreasuryApiError(message, response.status, data);
    }

    return data;
  };

  const getBalances = async () => {
    const data = await request('/api/treasury/balances');
    return Array.isArray(data?.balances) ? data.balances : [];
  };

  const listMovements = async ({
    page,
    limit,
    sortBy,
    sortDirection,
    filters = {},
  } = {}) => {
    const queryParameters = {};
    if (page) queryParameters.page = page;
    if (limit) queryParameters.limit = limit;
    if (sortBy) queryParameters.sortBy = sortBy;
    if (sortDirection) queryParameters.sortDirection = sortDirection;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParameters[key] = value;
      }
    });

    return request(`/api/treasury/movements${buildQueryString(queryParameters)}`);
  };

  const getMovement = async (movementId) => {
    if (!movementId) {
      throw new TreasuryApiError('Identificador de movimiento inválido.', 400);
    }
    const data = await request(`/api/treasury/movements/${movementId}`);
    return data?.movement || null;
  };

  const registerMovement = async (payload) =>
    request('/api/treasury/movements', {
      method: 'POST',
      body: payload,
    });

  const cancelMovement = async (movementId, body) =>
    request(`/api/treasury/movements/${movementId}/cancel`, {
      method: 'POST',
      body,
    });

  const compensateMovement = async (movementId, body) =>
    request(`/api/treasury/movements/${movementId}/compensate`, {
      method: 'POST',
      body,
    });

  const suggestCompensations = async (movementId, { limit } = {}) =>
    request(
      `/api/treasury/movements/${movementId}/suggestions${buildQueryString({
        limit,
      })}`
    );

  const searchClients = async ({ query = '', limit = 20 } = {}) => {
    const data = await request(
      `/api/clients${buildQueryString({
        q: query,
        limit,
      })}`
    );
    return Array.isArray(data?.items) ? data.items : [];
  };

  const TreasuryApi = {
    request,
    getBalances,
    listMovements,
    getMovement,
    registerMovement,
    cancelMovement,
    compensateMovement,
    suggestCompensations,
    searchClients,
  };

  global.TreasuryApiError = TreasuryApiError;
  global.TreasuryApi = TreasuryApi;
})(typeof window !== 'undefined' ? window : globalThis);
