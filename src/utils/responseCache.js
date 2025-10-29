const crypto = require('crypto');

// Simple in-memory cache. Suitable for small datasets and short TTLs.
// Key -> { payload, etag, expiresAt }
const cache = new Map();

function getEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt > Date.now()) {
    return entry;
  }
  cache.delete(key);
  return null;
}

function setEntry(key, payload, ttlMs) {
  const body = JSON.stringify(payload ?? null);
  const etag = `W/"${crypto.createHash('md5').update(body).digest('hex')}"`;
  const expiresAt = Date.now() + Number(ttlMs || 0);
  const value = { payload, etag, expiresAt };
  cache.set(key, value);
  return value;
}

async function sendCached({ req, res, compute, key, ttlMs }) {
  let entry = getEntry(key);
  if (!entry) {
    const payload = await compute();
    entry = setEntry(key, payload, ttlMs);
  }

  res.set('ETag', entry.etag);
  res.set('Cache-Control', `private, max-age=${Math.floor(Number(ttlMs || 0) / 1000)}`);

  const ifNoneMatch = req.get('If-None-Match');
  if (ifNoneMatch && ifNoneMatch === entry.etag) {
    return res.status(304).end();
  }

  return res.json(entry.payload);
}

function buildUserAwareKey(req, baseKey) {
  const userId = req.user?.id || req.user?._id || 'anon';
  return `${userId}:${baseKey}`;
}

module.exports = {
  sendCached,
  buildUserAwareKey,
  getEntry,
  setEntry,
};