let client = null;
let connectPromise = null;

function redisUrl() {
  return (process.env.REDIS_URL || '').trim() || null;
}

function loadCreateClient() {
  try {
    return require('redis').createClient;
  } catch (_) {
    return null;
  }
}

function isRedisReady() {
  return !!(client && client.isOpen);
}

async function getRedisClient() {
  if (isRedisReady()) return client;

  const url = redisUrl();
  if (!url) return null;

  const createClient = loadCreateClient();
  if (!createClient) return null;

  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const next = createClient({ url });
    next.on('error', (err) => {
      console.warn('[redis]', err.message);
    });
    try {
      await next.connect();
      client = next;
      return client;
    } catch (err) {
      console.warn('[redis] connect failed:', err.message);
      try {
        await next.quit();
      } catch (_) {}
      client = null;
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

async function closeRedis() {
  if (!client) return;
  try {
    if (client.isOpen) await client.quit();
  } catch (_) {}
  client = null;
}

module.exports = {
  redisUrl,
  getRedisClient,
  isRedisReady,
  closeRedis
};
