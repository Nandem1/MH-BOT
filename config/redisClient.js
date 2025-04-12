// config/redisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL; // ✅ ya viene completo en el .env

const redisClient = createClient({
  url: redisUrl, // 🔥 Solo redisUrl, no `redis://${redisUrl}`
  socket: {
    reconnectStrategy: retries => Math.min(retries * 50, 2000),
  }
});

// Listeners
redisClient.on('connect', () => console.log('✅ Redis conectado'));
redisClient.on('error', (err) => console.error('❌ Error en Redis:', err));

module.exports = redisClient;
