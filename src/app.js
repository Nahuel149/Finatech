const express = require('express');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const transactionRoutes = require('./routes/transaction.routes');
const transferRoutes = require('./routes/transfer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const geocodingRoutes = require('./routes/geocoding.routes');
const locationRoutes = require('./routes/location.routes');
const logisticsRoutes = require('./routes/logistics.routes');
const currentAccountRoutes = require('./routes/currentAccount.routes');
const logisticsOrderRoutes = require('./routes/logisticsOrder.routes');
const logisticsIncidentRoutes = require('./routes/logisticsIncident.routes');
const treasuryRoutes = require('./routes/treasury.routes');
const ratesRoutes = require('./routes/rates.routes');
const adminRoutes = require('./routes/admin.routes');
const liveOperationsRoutes = require('./routes/liveOperations.routes');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { ensureCsrfCookie, csrfProtect } = require('./middleware/csrf');
const { logger } = require('./utils/logger');

const app = express();
const clientBuildPath = path.join(process.cwd(), 'client', 'build');
const clientIndexPath = path.join(clientBuildPath, 'index.html');
const csrfProtectionEnabled = process.env.CSRF_PROTECTION_ENABLED !== 'false';
const ONE_YEAR_IN_SECONDS = 31536000;

app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(cookieParser());
if (csrfProtectionEnabled) {
  app.use(ensureCsrfCookie());
}
app.use(requestLogger);
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  next();
});

// Test endpoint (no middleware)
app.get('/api/test', (_req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint working' });
});

// Public API routes (no CSRF protection needed)
app.get('/api/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    googleMapsEnabled: Boolean(process.env.GOOGLE_MAPS_API_KEY),
    locationIqEnabled: Boolean(process.env.LOCATIONIQ_API_KEY),
    locationIqTilesKey: process.env.LOCATIONIQ_TILE_API_KEY || null,
    locationIqCountryCodes: process.env.LOCATIONIQ_COUNTRY_CODES || 'ar',
    locationIqBaseTilesUrl:
      process.env.LOCATIONIQ_BASE_TILES_URL ||
      'https://{s}.locationiq.com/v3/streets/r/{z}/{x}/{y}.png',
  });
});

app.get('/api/csrf-token', (req, res) => {
  logger.debug('csrf_token_requested', { origin: req.headers.origin || req.hostname });
  res.json({ csrfToken: res.locals.csrfToken || null });
});

// Apply CSRF protection to all API routes
if (csrfProtectionEnabled) {
  logger.debug('csrf_apply', { scope: '/api' });
  app.use('/api', (req, res, next) => {
    logger.debug('csrf_middleware', { method: req.method, path: req.path });
    return csrfProtect()(req, res, next);
  });
} else {
  logger.warn('csrf_disabled', {
    reason: 'CSRF_PROTECTION_ENABLED=false',
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api', logisticsOrderRoutes);
app.use('/api', logisticsIncidentRoutes);
app.use('/api/current-accounts', currentAccountRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/live-ops', liveOperationsRoutes);

// Simple health-check endpoint for Render
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

// Return JSON 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Serve React build for non-API routes
if (fs.existsSync(clientIndexPath)) {
  app.use(
    express.static(clientBuildPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return;
        }

        if (filePath.includes(`${path.sep}static${path.sep}`)) {
          res.setHeader('Cache-Control', `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);
          return;
        }

        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      },
    }),
  );
  // Serve the React SPA for any non-API route
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(clientIndexPath);
  });
} else {
  logger.warn('client_build_missing');
}

app.use(errorHandler);

module.exports = app;
