const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/38-customersupports-backfill-order-assignee');

describe('migration 38-customersupports-backfill-order-assignee', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-38');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('fills order and assigned_to from existing users/orders', async () => {
    const adminId = new ObjectId();
    const customerId = new ObjectId();
    const orderId = new ObjectId();
    const ticketId = new ObjectId();

    await db.collection('users').insertMany([
      { _id: adminId, email: 'admin@example.com', role: 'admin', name: 'Admin' },
      { _id: customerId, email: 'demo@customer.com', role: 'customer', name: 'Demo Customer' },
    ]);
    await db.collection('orders').insertOne({
      _id: orderId,
      user: customerId,
      status: 'delivered',
      restaurant: new ObjectId(),
      createdAt: new Date(),
    });
    await db.collection('customersupports').insertOne({
      _id: ticketId,
      type: 'live_chat',
      user: customerId,
      subject: 'Chat en direct - demo',
      description: 'Need help with my order',
      status: 'open',
      created_at: new Date(),
    });

    await migration.up(db);

    const updated = await db.collection('customersupports').findOne({ _id: ticketId });
    expect(String(updated.order)).toBe(String(orderId));
    expect(String(updated.assigned_to)).toBe(String(adminId));
    expect(updated.migrationSeedKey).toBe(migration.SEED_KEY);

    await migration.down(db);
    const restored = await db.collection('customersupports').findOne({ _id: ticketId });
    expect(restored.order).toBeUndefined();
    expect(restored.assigned_to).toBeUndefined();
    expect(restored.migrationSeedKey).toBeUndefined();
  });
});
