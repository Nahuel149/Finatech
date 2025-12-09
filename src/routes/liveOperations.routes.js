const { Router } = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { requirePermission } = require('../middleware/requirePermission');
const { listActiveOperations } = require('../services/liveOperations.service');

const router = Router();

router.get('/operations/active', requireAuth, requirePermission('view-balances'), async (_req, res, next) => {
  try {
    const payload = await listActiveOperations();
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get('/operations/events', requireAuth, requirePermission('view-balances'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  } else {
    res.write('\n');
  }

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    clearInterval(pollInterval);
    res.end();
  };

  const send = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      cleanup();
    }
  };

  const sendSnapshot = async () => {
    try {
      const payload = await listActiveOperations();
      send('live-operations', { type: 'snapshot', ...payload });
    } catch (error) {
      send('live-operations', { type: 'error', message: error.message || 'snapshot_failed' });
    }
  };

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (error) {
      cleanup();
    }
  }, 30000);

  const pollInterval = setInterval(sendSnapshot, 5000);

  send('live-operations', { type: 'connected', timestamp: new Date().toISOString() });
  sendSnapshot();

  req.on('close', cleanup);
  req.on('error', cleanup);
});

module.exports = router;
