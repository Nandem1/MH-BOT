// clearQueue.js
const Queue = require('bull');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;

const facturaQueue = new Queue('facturas', redisUrl);
const notaCreditoQueue = new Queue('notasCredito', redisUrl);

const clearQueue = async (queue, name) => {
  console.log(`🧹 Limpiando cola "${name}"...`);
  await queue.clean(0, 'completed');
  await queue.clean(0, 'failed');
  await queue.empty();
  console.log(`✅ Cola "${name}" limpia ✅`);
};

(async () => {
  try {
    await clearQueue(facturaQueue, 'facturas');
    await clearQueue(notaCreditoQueue, 'notasCredito');
  } catch (err) {
    console.error('❌ Error limpiando colas:', err);
  } finally {
    process.exit(0);
  }
})();
