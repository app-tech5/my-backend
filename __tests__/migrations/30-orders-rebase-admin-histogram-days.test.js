const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/30-orders-rebase-admin-histogram-days');

describe('migration 30-orders-rebase-admin-histogram-days', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-30');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('rebases migration_29 July day 23 to day 18', async () => {
    const restaurantId = new ObjectId();
    const oldDays = [3, 7, 11, 15, 19, 23];
    const orders = oldDays.map((day) => ({
      _id: new ObjectId(),
      restaurant: restaurantId,
      status: day === 23 ? 'cancelled' : 'delivered',
      migrationSeedKey: migration.SOURCE_SEED_KEY,
      createdAt: new Date(2026, 6, day, 12, 30, 0, 0),
      updatedAt: new Date(2026, 6, day, 12, 30, 0, 0)
    }));

    await db.collection('orders').insertMany(orders);
    await migration.up(db);

    const touched = await db.
    collection('orders').
    find({ migrationSeedKey: migration.SOURCE_SEED_KEY }).
    sort({ createdAt: 1 }).
    toArray();

    expect(touched).toHaveLength(6);
    expect(touched.map((o) => o.createdAt.getDate())).toEqual(migration.DAYS_PER_MONTH);
    expect(touched.every((o) => o.migration30SeedKey === migration.SEED_KEY)).toBe(true);
    expect(touched.some((o) => o.createdAt.getDate() === 23)).toBe(false);
  });

  it('is idempotent when run twice', async () => {
    await db.collection('orders').insertOne({
      _id: new ObjectId(),
      migrationSeedKey: migration.SOURCE_SEED_KEY,
      createdAt: new Date(2026, 6, 23, 12, 30, 0, 0),
      updatedAt: new Date(2026, 6, 23, 12, 30, 0, 0)
    });

    await migration.up(db);
    const first = await db.collection('orders').findOne({ migrationSeedKey: migration.SOURCE_SEED_KEY });

    await migration.up(db);
    const second = await db.collection('orders').findOne({ migrationSeedKey: migration.SOURCE_SEED_KEY });

    expect(second.createdAt.toISOString()).toBe(first.createdAt.toISOString());
    expect(second.migration30PreviousCreatedAt.toISOString()).toBe(
      first.migration30PreviousCreatedAt.toISOString()
    );
  });

  it('down restores previous dates', async () => {
    const orderId = new ObjectId();
    const original = new Date(2026, 6, 23, 12, 30, 0, 0);

    await db.collection('orders').insertOne({
      _id: orderId,
      migrationSeedKey: migration.SOURCE_SEED_KEY,
      createdAt: original,
      updatedAt: original
    });

    await migration.up(db);
    const migrated = await db.collection('orders').findOne({ _id: orderId });
    expect(migrated.createdAt.getDate()).toBe(3);

    await migration.down(db);
    const restored = await db.collection('orders').findOne({ _id: orderId });
    expect(restored.createdAt.toISOString()).toBe(original.toISOString());
    expect(restored.migration30SeedKey).toBeUndefined();
  });
});
