require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { seedLogisticsOperations } = require('./utils/seedLogisticsOperations');
const { logger } = require('./utils/logger');

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
  logger.info('server_shutdown', { signal });

  try {
    await closeServer();
  } catch (error) {
    logger.error('server_close_error', { message: error.message });
  }

  try {
    await mongoose.connection.close(false);
  } catch (error) {
    logger.error('mongodb_close_error', { message: error.message });
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
      logger.info('server_listening', { port: PORT });
    });
  } catch (error) {
    logger.error('server_start_failed', { message: error.message });
    process.exit(1);
  }
})();

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.once('SIGUSR2', () => shutdown('SIGUSR2', 0));
