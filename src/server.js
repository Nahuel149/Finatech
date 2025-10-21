require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { seedLogisticsOperations } = require('./utils/seedLogisticsOperations');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDatabase();
    await seedLogisticsOperations();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
})();
