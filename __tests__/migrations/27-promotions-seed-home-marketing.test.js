const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/27-promotions-seed-home-marketing');

describe('migration 27-promotions-seed-home-marketing', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-27');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('refreshes expired promotions and seeds marketing promos', async () => {
    const userId = new ObjectId();
    const restaurantId = new ObjectId();
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await db.collection('users').insertOne({ _id: userId, role: 'admin', name: 'Admin' });
    await db.collection('restaurants').insertMany([
      { _id: restaurantId, name: 'Bistro One', rating: 4.8 },
      { _id: new ObjectId(), name: 'Bistro Two', rating: 4.5 },
    ]);
    await db.collection('promotions').insertOne({
      name: 'Expired restaurant promo',
      description: 'Old promo',
      promotionType: 'percentage_discount',
      discountValue: 15,
      scope: 'restaurant',
      applicableRestaurants: [restaurantId],
      applicableCategories: [],
      applicableItems: [],
      startDate: past,
      endDate: past,
      isActive: true,
      priority: 5,
      userEligibility: 'all',
      currentUsage: 0,
      createdBy: userId,
      createdAt: past,
      updatedAt: past,
    });

    await migration.up(db);

    const refreshed = await db.collection('promotions').findOne({ name: 'Expired restaurant promo' });
    expect(refreshed.endDate.getTime()).toBeGreaterThan(Date.now());

    const seeded = await db.collection('promotions').find({ migrationSeedKey: migration.SEED_KEY }).toArray();
    expect(seeded.length).toBeGreaterThanOrEqual(6);
    expect(seeded.some((promo) => promo.scope === 'platform')).toBe(true);
    expect(seeded.some((promo) => promo.scope === 'restaurant')).toBe(true);
  });

  it('is idempotent', async () => {
    const userId = new ObjectId();
    await db.collection('users').insertOne({ _id: userId, role: 'admin' });
    await db.collection('restaurants').insertOne({ _id: new ObjectId(), name: 'Test', rating: 4 });

    await migration.up(db);
    await migration.up(db);

    const seeded = await db.collection('promotions').find({ migrationSeedKey: migration.SEED_KEY }).toArray();
    expect(seeded.length).toBe(9);
  });

  it('down removes only seeded promotions', async () => {
    const userId = new ObjectId();
    await db.collection('users').insertOne({ _id: userId, role: 'admin' });
    await db.collection('restaurants').insertOne({ _id: new ObjectId(), name: 'Test', rating: 4 });

    await migration.up(db);
    await migration.down(db);

    const seeded = await db.collection('promotions').countDocuments({ migrationSeedKey: migration.SEED_KEY });
    expect(seeded).toBe(0);
  });
});
