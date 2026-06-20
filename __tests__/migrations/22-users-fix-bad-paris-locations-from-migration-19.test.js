const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/22-users-fix-bad-paris-locations-from-migration-19');

describe('migration 22-users-fix-bad-paris-locations-from-migration-19', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-22');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('detects invalid migration 19 assignments', () => {
    expect(
      migration.isBadParisBackfillLocation({
        address: '275 Rue de la Boétie, 75009 Paris',
        location: { latitude: 48.9453786, longitude: 2.5148597 },
      })
    ).toBe(true);

    expect(
      migration.isBadParisBackfillLocation({
        address: '4 undefined, 75040 Paris',
        location: { latitude: 48.838278, longitude: 2.5663404 },
      })
    ).toBe(true);

    expect(
      migration.isBadParisBackfillLocation({
        address: '1 Rue Rossini, 75009 Paris',
        location: { latitude: 48.8729866, longitude: 2.3409458 },
      })
    ).toBe(false);
  });

  it('fixes bad users and leaves valid users unchanged', async () => {
    const usersCol = db.collection('users');
    const goodId = new ObjectId();
    const badId = new ObjectId();

    await usersCol.insertMany([
      {
        _id: goodId,
        role: 'customer',
        name: 'Good User',
        address: '1 Rue Rossini, 75009 Paris',
        location: { latitude: 48.8729866, longitude: 2.3409458 },
      },
      {
        _id: badId,
        role: 'customer',
        name: 'Bad User',
        address: '275 Rue de la Boétie, 75009 Paris',
        location: { latitude: 48.9453786, longitude: 2.5148597 },
      },
    ]);

    await migration.up(db);

    const good = await usersCol.findOne({ _id: goodId });
    const bad = await usersCol.findOne({ _id: badId });

    expect(good.location).toEqual({ latitude: 48.8729866, longitude: 2.3409458 });
    expect(bad.location.latitude).toBeGreaterThan(48.81);
    expect(bad.location.latitude).toBeLessThan(48.91);
    expect(bad.address).not.toContain('undefined');
    expect(bad.address).toMatch(/Paris$/);
  });

  it('recalculates delivery fees for fixed users orders', async () => {
    const restaurantId = new ObjectId();
    const userId = new ObjectId();
    const orderId = new ObjectId();

    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      latitude: '48.8715899',
      longitude: '2.3487251',
    });

    await db.collection('users').insertOne({
      _id: userId,
      role: 'customer',
      address: '158 Rue de Tolbiac, 75034 Paris',
      location: { latitude: 48.9450708, longitude: 2.5323919 },
    });

    await db.collection('deliverysettings').insertOne({
      restaurant: restaurantId,
      isDeliveryEnabled: true,
      deliveryFeeType: 'DYNAMIC',
      fixedDeliveryFee: 5.65,
      freeDeliveryThreshold: 25,
      dynamicDeliveryFee: {
        baseFee: 2.7,
        perKmFee: 0.8,
        minFee: 2.5,
        maxFee: 15,
      },
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      user: userId,
      restaurant: restaurantId,
      subtotal: 20,
      tax: { amount: 2 },
      delivery: { type: 'delivery', deliveryFee: 5.65 },
      totalPrice: 27.65,
      items: [{ price: 20, quantity: 1 }],
    });

    await migration.up(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.delivery.deliveryFee).not.toBe(5.65);
    expect(order.totalPrice).not.toBe(27.65);
  });

  it('restores users and orders on down', async () => {
    const usersCol = db.collection('users');
    const userId = new ObjectId();

    await usersCol.insertOne({
      _id: userId,
      role: 'customer',
      name: 'Bad User',
      address: '55 undefined, 75025 Paris',
      location: { latitude: 48.9318756, longitude: 2.4416909 },
    });

    await migration.up(db);
    await migration.down(db);

    const user = await usersCol.findOne({ _id: userId });
    expect(user.address).toBe('55 undefined, 75025 Paris');
    expect(user.location).toEqual({ latitude: 48.9318756, longitude: 2.4416909 });
  });
});
