(function configureFrontend(global) {
  // Set this to your backend origin, e.g.:
  // global.API_BASE_URL = 'https://finatech-api.onrender.com';
  // Leave as empty string to use same-origin relative requests in local dev.
  global.API_BASE_URL = 'https://finatech-qp5l.onrender.com';

  // Helper to resolve URLs against the backend origin.
  // Accepts absolute URLs unchanged.
  global.apiUrl = function apiUrl(path) {
    if (typeof path !== 'string') return path;
    if (/^https?:\/\//i.test(path)) return path;
    const base = (global.API_BASE_URL || '').trim();
    if (!base) return path;
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  };
})(typeof window !== 'undefined' ? window : globalThis);