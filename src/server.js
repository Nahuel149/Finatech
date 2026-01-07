require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { seedLogisticsOperations } = require('./utils/seedLogisticsOperations');

const PORT = process.env.PORT || 4000;
let server;
let isShuttingDown = false;

const closeServer = () =>
  new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    server.close(() => resolve());
  });

const shutdown = async (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`[SERVER] Received ${signal}. Shutting down...`);

  try {
    await closeServer();
  } catch (error) {
    console.error('[SERVER] Error closing HTTP server', error);
  }

  try {
    await mongoose.connection.close(false);
  } catch (error) {
    console.error('[SERVER] Error closing MongoDB connection', error);
  }

  if (signal === 'SIGUSR2') {
    process.kill(process.pid, 'SIGUSR2');
    return;
  }

  process.exit(exitCode);
};

(async () => {
  try {
    await connectDatabase();
    await seedLogisticsOperations();
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
})();

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.once('SIGUSR2', () => shutdown('SIGUSR2', 0));
