const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync } = require('child_process');

describe('Database Migrations Tests', () => {
  let client;
  let db;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    const dbName = 'test-migrations-db';

    process.env.MONGO_URI = mongoUri;
    process.env.MONGODB_DATABASE = dbName;

    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
  }, { timeout: 120000 });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, { timeout: 120000 });

  beforeEach(async () => {
    await db.dropDatabase();
  });

  function runMigrateUp() {
    const env = {
      ...process.env,
      MONGO_URI: process.env.MONGO_URI,
      MONGODB_DATABASE: process.env.MONGODB_DATABASE,
    };

    execSync('npm run migrate:up', { env, stdio: 'pipe' });
  }

  test('should execute all pending migrations successfully', async () => {
    runMigrateUp();

    const changelog = await db.collection('changelog').find({}).toArray();
    expect(changelog.length).toBeGreaterThan(0);
  }, { timeout: 120000 });

  test('should seed payment gateways on a fresh database', async () => {
    runMigrateUp();

    const gateways = await db.collection('gateways').find({}).toArray();
    expect(gateways.length).toBe(8);
    expect(gateways.map((g) => g.identifier)).toContain('stripe');
    expect(gateways.map((g) => g.identifier)).toContain('cash-on-delivery');
  }, { timeout: 120000 });

  test('should record each migration in the changelog', async () => {
    runMigrateUp();

    const changelog = await db.collection('changelog').find({}).toArray();
    const fileNames = changelog.map((entry) => entry.fileName);

    expect(fileNames.some((name) => name.includes('12-3-gateways-seed'))).toBe(true);
    expect(fileNames.some((name) => name.includes('19-users-backfill-paris-locations'))).toBe(true);
    expect(fileNames.some((name) => name.includes('22-users-fix-bad-paris-locations-from-migration-19'))).toBe(true);
  }, { timeout: 120000 });

  test('should NOT create sensitive collections on a fresh database', async () => {
    runMigrateUp();

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    expect(collectionNames).not.toContain('users');
    expect(collectionNames).not.toContain('restaurants');
    expect(collectionNames).not.toContain('orders');
    expect(collectionNames).not.toContain('drivers');
  }, { timeout: 120000 });
});
