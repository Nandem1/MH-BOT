// utils/redisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL; // 🔥 Deberías tener esto en tu .env

const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('connect', () => {
  console.log('✅ Conectado a Redis');
});

redisClient.on('error', (err) => {
  console.error('❌ Error en Redis:', err);
});

// Inicializar la conexión
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error);
  }
})();

module.exports = { redisClient };
