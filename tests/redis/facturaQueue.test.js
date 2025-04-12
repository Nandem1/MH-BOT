// tests/redis/facturaQueue.test.js
const { enqueueFactura, facturaQueue } = require('../../queues/facturaQueue');
const redisClient = require('../../config/redisClient');

describe('🧪 Test de la cola facturaQueue', () => {
  const facturaMock = {
    folio: "123456789",
    rut: "11111111-1",
    filePath: "temp/factura_123456789.jpg",
    id_usuario: 1,
    id_local: 1
  };

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  afterEach(async () => {
    await facturaQueue.empty(); // Limpiamos la cola después de cada test
  });

  test('Debería encolar una factura', async () => {
    const job = await enqueueFactura(facturaMock);

    expect(job.id).toBeDefined();          // 🔥 Ahora sí tiene un id
    expect(job.data.folio).toBe(facturaMock.folio);
  });

  test('Debería procesar una factura', async () => {
    const job = await enqueueFactura(facturaMock);

    // Procesador simulado
    await new Promise((resolve, reject) => {
      facturaQueue.process(async (job) => {
        try {
          expect(job.data.folio).toBe(facturaMock.folio);
          console.log("✅ Factura procesada exitosamente:", job.data.folio);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
