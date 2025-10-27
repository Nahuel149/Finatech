const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const transactionRoutes = require('./routes/transaction.routes');
const transferRoutes = require('./routes/transfer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const geocodingRoutes = require('./routes/geocoding.routes');
const logisticsRoutes = require('./routes/logistics.routes');
const currentAccountRoutes = require('./routes/currentAccount.routes');
const treasuryRoutes = require('./routes/treasury.routes');
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
app.use('/api', csrfProtect);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/current-accounts', currentAccountRoutes);
app.use('/api/treasury', treasuryRoutes);
app.get('/api/config', (_req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    googleMapsEnabled: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  });
});

// Serve React build files
const buildDir = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(buildDir));

// Serve React app for specific routes (SPA routing)
app.get(['/', '/login', '/register', '/dashboard'], (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

// Catch-all for other routes
app.use((_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
