const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const path = require('path');  // Removed unused import
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const transactionRoutes = require('./routes/transaction.routes');
const transferRoutes = require('./routes/transfer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const geocodingRoutes = require('./routes/geocoding.routes');
const logisticsRoutes = require('./routes/logistics.routes');
const currentAccountRoutes = require('./routes/currentAccount.routes');
const treasuryRoutes = require('./routes/treasury.routes');
const ratesRoutes = require('./routes/rates.routes');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler } = require('./middleware/errorHandler');
const { ensureCsrfCookie, csrfProtect } = require('./middleware/csrf');

const app = express();

app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(ensureCsrfCookie());
app.use(requestLogger);

// Test endpoint (no middleware)
app.get('/api/test', (_req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint working' });
});

// Public API routes (no CSRF protection needed)
app.get('/api/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    googleMapsEnabled: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  });
});

// Apply CSRF protection to all API routes
console.log('[APP] Applying CSRF protection to /api routes');
app.use('/api', (req, res, next) => {
  console.log(`[APP] CSRF middleware called for ${req.method} ${req.path}`);
  return csrfProtect()(req, res, next);
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/current-accounts', currentAccountRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/rates', ratesRoutes);

// Simple health-check endpoint for Render
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'API running' });
});

app.use(errorHandler);

module.exports = app;
