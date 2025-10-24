const mongoose = require('mongoose');

const connectDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 20,
    connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 5000,
    socketTimeoutMS: Number(process.env.DB_SOCKET_TIMEOUT_MS) || 20000,
  });

  console.log('MongoDB connected');
};

module.exports = { connectDatabase };
