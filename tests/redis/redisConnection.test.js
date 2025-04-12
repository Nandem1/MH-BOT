// tests/redis/redisConnection.test.js
const redisClient = require('../../config/redisClient');

describe('🧪 Redis Connection', () => {
  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  });

  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  });

  test('Debe conectarse correctamente a Redis', async () => {
    expect(redisClient.isOpen).toBe(true);
  });

  test('Debe setear y obtener un valor en Redis', async () => {
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  test('Debe eliminar un valor en Redis', async () => {
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).toBeNull();
  });
});
