const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/28-restaurant-demo-dashboard-marketing');

describe('migration 28-restaurant-demo-dashboard-marketing', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-28');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('links demo restaurant user and refreshes order dates', async () => {
    const restaurantId = new ObjectId();
    const userId = new ObjectId();
    const orderId = new ObjectId();
    const past = new Date('2026-01-10T12:00:00.000Z');

    await db.collection('users').insertOne({
      _id: userId,
      email: migration.DEMO_EMAIL,
      role: 'restaurant',
      name: 'Demo Restaurant',
      restaurant: restaurantId,
    });

    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      name: 'Hermiston LLC',
      users: { value: new ObjectId(), label: 'Old Owner' },
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      restaurant: restaurantId,
      status: 'pending',
      totalPrice: 24.5,
      createdAt: past,
      updatedAt: past,
    });

    await migration.up(db);

    const restaurant = await db.collection('restaurants').findOne({ _id: restaurantId });
    expect(String(restaurant.users.value)).toBe(String(userId));

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.migrationSeedKey).toBe(migration.SEED_KEY);
    expect(order.createdAt.getTime()).toBeGreaterThan(past.getTime());
  });

  it('down restores previous restaurant user and order dates', async () => {
    const restaurantId = new ObjectId();
    const userId = new ObjectId();
    const orderId = new ObjectId();
    const past = new Date('2026-01-10T12:00:00.000Z');

    await db.collection('users').insertOne({
      _id: userId,
      email: migration.DEMO_EMAIL,
      role: 'restaurant',
      restaurant: restaurantId,
    });

    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      name: 'Hermiston LLC',
      users: { value: new ObjectId(), label: 'Old Owner' },
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      restaurant: restaurantId,
      status: 'delivered',
      totalPrice: 19,
      createdAt: past,
      updatedAt: past,
    });

    await migration.up(db);
    await migration.down(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.migrationSeedKey).toBeUndefined();
    expect(order.createdAt.toISOString()).toBe(past.toISOString());
  });
});
