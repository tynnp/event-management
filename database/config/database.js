// Database Configuration
// Cấu hình kết nối cho PostgreSQL và MongoDB

import { Pool } from 'pg';
import { MongoClient, ObjectId } from 'mongodb';

// PostgreSQL Configuration
const postgresConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'event_management',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// MongoDB Configuration
const mongoConfig = {
  url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  database: process.env.MONGODB_DB || 'event_management',
  options: {
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
    // bufferMaxEntries: 0, // Disable mongoose buffering
    // bufferCommands: false, // Disable mongoose buffering
  }
};

// PostgreSQL Connection Pool
let postgresPool = null;

const getPostgresPool = () => {
  if (!postgresPool) {
    postgresPool = new Pool(postgresConfig);
    
    // Handle pool errors
    postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return postgresPool;
};

// MongoDB Connection
let mongoClient = null;
let mongoDb = null;

const connectMongoDB = async () => {
  if (!mongoClient) {
    try {
      mongoClient = new MongoClient(mongoConfig.url, mongoConfig.options);
      await mongoClient.connect();
      mongoDb = mongoClient.db(mongoConfig.database);
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return mongoDb;
};

const getMongoDB = () => {
  if (!mongoDb) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return mongoDb;
};

// Database Health Check
const checkDatabaseHealth = async () => {
  const health = {
    postgres: { status: 'disconnected', error: null },
    mongodb: { status: 'disconnected', error: null }
  };

  // Check PostgreSQL
  try {
    const pool = getPostgresPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.postgres.status = 'connected';
  } catch (error) {
    health.postgres.status = 'error';
    health.postgres.error = error.message;
  }

  // Check MongoDB
  try {
    const db = await connectMongoDB();
    await db.admin().ping();
    health.mongodb.status = 'connected';
  } catch (error) {
    health.mongodb.status = 'error';
    health.mongodb.error = error.message;
  }

  return health;
};

// Graceful shutdown
const closeConnections = async () => {
  console.log('Closing database connections...');
  
  if (postgresPool) {
    await postgresPool.end();
    console.log('PostgreSQL connection pool closed');
  }
  
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB connection closed');
  }
};

// Handle process termination
process.on('SIGINT', closeConnections);
process.on('SIGTERM', closeConnections);

export {
  postgresConfig,
  mongoConfig,
  getPostgresPool,
  connectMongoDB,
  getMongoDB,
  checkDatabaseHealth,
  closeConnections
};
