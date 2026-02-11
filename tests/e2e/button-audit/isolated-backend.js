const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../../src/app');
const User = require('../../../src/models/User');
const { seedLogisticsOperations } = require('../../../src/utils/seedLogisticsOperations');

const AUDIT_USER = {
  fullName: 'QA Button Audit',
  email: 'qa.button.audit@example.com',
  password: 'QaButton123',
  permissions: [
    'view-balances',
    'access-treasury',
    'access-transfers',
    'manage-treasury',
    'manage-market-rates',
    'manage-notifications',
    'access-operations',
    'access-logistics',
    'manage-logistics',
    'treasury:receptions',
    'treasury:receptions:revert',
    'admin:manage-permissions',
  ],
};

const PORT = Number(process.env.AUDIT_API_PORT || 4000);

let mongoServer;
let server;

const shutdown = async (code = 0) => {
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('backend_close_failed', error.message);
  }

  try {
    await mongoose.disconnect();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('mongoose_disconnect_failed', error.message);
  }

  try {
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('mongo_stop_failed', error.message);
  }

  process.exit(code);
};

const ensureAuditUser = async () => {
  const passwordHash = await bcrypt.hash(AUDIT_USER.password, 12);

  await User.findOneAndUpdate(
    { email: AUDIT_USER.email },
    {
      $set: {
        fullName: AUDIT_USER.fullName,
        email: AUDIT_USER.email,
        passwordHash,
        providers: [{ provider: 'local' }],
        isVerified: true,
        permissions: AUDIT_USER.permissions,
        isMessenger: true,
        twoFactor: {
          enabled: false,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const main = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { dbName: 'finatech-button-audit' });
  await seedLogisticsOperations();
  await ensureAuditUser();

  server = http.createServer(app);
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`BUTTON_AUDIT_BACKEND_READY port=${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`BUTTON_AUDIT_USER email=${AUDIT_USER.email} password=${AUDIT_USER.password}`);
  });
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('uncaught_exception', error);
  shutdown(1);
});
process.on('unhandledRejection', (error) => {
  // eslint-disable-next-line no-console
  console.error('unhandled_rejection', error);
  shutdown(1);
});

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('button_audit_backend_start_failed', error);
  shutdown(1);
});
