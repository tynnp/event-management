//file: api/express-rest-api/src/config/redis.js
const redis = require('redis');

let client;

async function connectRedis() {
  if (!client) {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => console.error('❌ Redis Client Error:', err));
    client.on('connect', () => console.log('✅ Redis connected'));

    await client.connect();
  }
  return client;
}

module.exports = { connectRedis };
