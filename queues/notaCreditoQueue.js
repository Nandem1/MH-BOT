// queues/notaCreditoQueue.js
const Queue = require('bull');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;           //  →  redis://user:pass@host:port
const notaCreditoQueue = new Queue('notasCredito', redisUrl);

/* ── debug ──────────────────────────────────────────── */
notaCreditoQueue.on('waiting', id   => console.log(`🛎️  NC en espera (Job ${id})`));
notaCreditoQueue.on('active',  job  => console.log(`🔵  NC activa →`, job.data));
notaCreditoQueue.on('failed',  (job,e)=>console.error(`❌  NC falló (Job ${job.id})`,e));
notaCreditoQueue.on('completed',job => console.log(`✅  NC completada (Job ${job.id})`));
/* ───────────────────────────────────────────────────── */

const enqueueNotaCredito = async (payload) => {
  const job = await notaCreditoQueue.add(payload, { attempts: 3, backoff: 5_000 });
  return job;
};

const processNotasCredito = (cb) => {
  notaCreditoQueue.process(async (job) => { await cb(job); });
};

module.exports = { enqueueNotaCredito, processNotasCredito };
