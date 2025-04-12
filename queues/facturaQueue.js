// queues/facturaQueue.js
const Queue = require('bull');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;

const facturaQueue = new Queue('facturas', redisUrl);

// 🚀🚀 Agregamos un debug aquí
facturaQueue.on('waiting', (jobId) => {
  console.log(`🛎️ Trabajo en espera en Redis. Job ID: ${jobId}`);
});

// 🚀🚀 Otro debug al recibir un trabajo
facturaQueue.on('active', (job) => {
  console.log(`🔵 Trabajo activo. Procesando:`, job.data);
});

const enqueueFactura = async (facturaData) => {
  const job = await facturaQueue.add(facturaData, {
    attempts: 3,
    backoff: 5000
  });
  console.log('📥 Factura encolada:', job.id);
  return job;
};

const processFacturas = (callback) => {
  facturaQueue.process(async (job) => {
    console.log('📥 Se recibió un trabajo de Redis (dentro de process())');
    await callback(job);
  });
};

module.exports = {
  enqueueFactura,
  processFacturas,
};
