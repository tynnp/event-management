const mongoose = require('mongoose');
const { Pool } = require('pg');

const connectMongoDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('MongoDB connected');
};

// Kết nối PostgreSQL
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

pgPool.connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

function getPostgresPool() {
  return pgPool;
}

module.exports = {
  connectMongoDB,
  getPostgresPool,
};