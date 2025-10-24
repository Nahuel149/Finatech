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

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/registration', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/recover', (_req, res) => {
  res.sendFile(path.join(publicDir, 'recover.html'));
});

app.get('/reset', (_req, res) => {
  res.sendFile(path.join(publicDir, 'recover.html'));
});

app.get(['/dashboard', '/dashboard/:section'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'dashboard.html'));
});

app.get('/dashboard/operations/new', (_req, res) => {
  res.sendFile(path.join(publicDir, 'operations-new.html'));
});

app.get('/dashboard/operations/new/settlement', (_req, res) => {
  res.sendFile(path.join(publicDir, 'operations-settlement.html'));
});

app.get('/dashboard/operations/new/summary', (_req, res) => {
  res.sendFile(path.join(publicDir, 'operations-summary.html'));
});

app.get('/tesoreria', (_req, res) => {
  res.sendFile(path.join(publicDir, 'tesoreria-saldos.html'));
});

app.get('/tesoreria/contacto/:contactId', (_req, res) => {
  res.sendFile(path.join(publicDir, 'saldos-contacto.html'));
});

app.get('/tesoreria/movimientos', (_req, res) => {
  res.sendFile(path.join(publicDir, 'tesoreria-movimientos.html'));
});

app.get('/tesoreria/movimientos/nuevo', (_req, res) => {
  res.sendFile(path.join(publicDir, 'tesoreria-registrar-movimiento.html'));
});

app.get('/tesoreria/movimientos/:movementId', (_req, res) => {
  res.sendFile(path.join(publicDir, 'tesoreria-movimiento-detalle.html'));
});

app.get('/tesoreria/conciliacion', (_req, res) => {
  res.sendFile(path.join(publicDir, 'tesoreria-conciliacion.html'));
});

app.get('/saldos', (_req, res) => {
  res.sendFile(path.join(publicDir, 'saldos-overview.html'));
});

app.get('/saldos/contacto/:contactId', (_req, res) => {
  res.sendFile(path.join(publicDir, 'saldos-contacto.html'));
});

app.get('/logistica', (_req, res) => {
  res.sendFile(path.join(publicDir, 'logistica-panel.html'));
});

app.get('/dashboard/operations/confirmation', (_req, res) => {
  res.sendFile(path.join(publicDir, 'operations-confirmation.html'));
});

app.get('/dashboard/operations/transfer-ars', (_req, res) => {
  res.sendFile(path.join(publicDir, 'transferencia-pesos.html'));
});

app.get('/dashboard/operations/transfer-ars/amount', (_req, res) => {
  res.sendFile(path.join(publicDir, 'transferencia-pesos-monto.html'));
});

app.get('/dashboard/operations/transfer-ars/distribution', (_req, res) => {
  res.sendFile(path.join(publicDir, 'transferencia-pesos-distribucion.html'));
});

app.get('/dashboard/operations/transfer-ars/confirmation', (_req, res) => {
  res.sendFile(path.join(publicDir, 'transferencia-pesos-confirmacion.html'));
});

app.use((_req, res) => {
  res.status(404).json({ message: 'No encontrado' });
});

app.use(errorHandler);

module.exports = app;
