const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/23-notifications-seed-demo-driver');

describe('migration 23-notifications-seed-demo-driver', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-23');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('seeds notifications for the demo driver user', async () => {
    const orderId = new ObjectId();

    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      role: 'delivery',
      name: 'Demo Driver',
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      driver: migration.DEMO_DRIVER_ID,
      status: 'delivered',
      createdAt: new Date(),
    });

    await migration.up(db);

    const notifications = await db
      .collection('notifications')
      .find({ user: migration.DEMO_USER_ID })
      .toArray();

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((n) => n.actionData?.seedKey === migration.SEED_KEY)).toBe(true);
    expect(notifications.some((n) => n.type === 'order' && !n.isRead)).toBe(true);
    expect(notifications.some((n) => n.type === 'promotion')).toBe(true);
    expect(notifications.some((n) => n.relatedEntity?.equals(orderId))).toBe(true);
  });

  it('is idempotent', async () => {
    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      role: 'delivery',
      name: 'Demo Driver',
    });

    await migration.up(db);
    await migration.up(db);

    const count = await db.collection('notifications').countDocuments({
      'actionData.seedKey': migration.SEED_KEY,
    });

    expect(count).toBeGreaterThan(0);
  });

  it('removes seeded notifications on down', async () => {
    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      role: 'delivery',
      name: 'Demo Driver',
    });

    await migration.up(db);
    await migration.down(db);

    const count = await db.collection('notifications').countDocuments({
      'actionData.seedKey': migration.SEED_KEY,
    });

    expect(count).toBe(0);
  });
});
