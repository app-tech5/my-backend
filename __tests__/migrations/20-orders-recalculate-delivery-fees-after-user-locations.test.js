const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration16 = require('../../migrations/16-orders-fix-absurd-delivery-fees');
const migration20 = require('../../migrations/20-orders-recalculate-delivery-fees-after-user-locations');

describe('migration 20-orders-recalculate-delivery-fees-after-user-locations', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-20');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('recalculates stale fixed fallback fee when user now has location', async () => {
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
      location: { latitude: 48.8345672, longitude: 2.3264158 },
    });

    await db.collection('deliverysettings').insertOne({
      restaurant: restaurantId,
      isDeliveryEnabled: true,
      deliveryFeeType: 'DYNAMIC',
      fixedDeliveryFee: 5.65,
      freeDeliveryThreshold: 25,
      dynamicDeliveryFee: {
        baseFee: 2.7,
        perKmFee: 1.12,
        minFee: 2.94,
        maxFee: 9.79,
      },
      maxDeliveryDistance: 10,
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      user: userId,
      restaurant: restaurantId,
      subtotal: 22,
      tax: { rate: 0.1, amount: 2.2 },
      delivery: { type: 'delivery', deliveryFee: 5.65 },
      totalPrice: 29.85,
    });

    await migration20.up(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.delivery.deliveryFee).toBe(7.63);
    expect(order.totalPrice).toBe(31.83);
  });

  it('does not change orders when user still has no location', async () => {
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
      address: 'No GPS',
    });

    await db.collection('deliverysettings').insertOne({
      restaurant: restaurantId,
      deliveryFeeType: 'FIXED',
      fixedDeliveryFee: 5.65,
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      user: userId,
      restaurant: restaurantId,
      subtotal: 22,
      tax: { rate: 0.1, amount: 2.2 },
      delivery: { type: 'delivery', deliveryFee: 5.65 },
      totalPrice: 29.85,
    });

    await migration20.up(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.delivery.deliveryFee).toBe(5.65);
  });

  it('restores previous values on down', async () => {
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
      location: { latitude: 48.8345672, longitude: 2.3264158 },
    });

    await db.collection('deliverysettings').insertOne({
      restaurant: restaurantId,
      isDeliveryEnabled: true,
      deliveryFeeType: 'DYNAMIC',
      fixedDeliveryFee: 5.65,
      freeDeliveryThreshold: 25,
      dynamicDeliveryFee: {
        baseFee: 2.7,
        perKmFee: 1.12,
        minFee: 2.94,
        maxFee: 9.79,
      },
      maxDeliveryDistance: 10,
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      user: userId,
      restaurant: restaurantId,
      subtotal: 22,
      tax: { rate: 0.1, amount: 2.2 },
      delivery: { type: 'delivery', deliveryFee: 5.65 },
      totalPrice: 29.85,
    });

    await migration20.up(db);
    await migration20.down(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(order.delivery.deliveryFee).toBe(5.65);
    expect(order.totalPrice).toBe(29.85);
  });

  it('shouldRecalculateDeliveryFee detects stale fees', () => {
    const order = { delivery: { type: 'delivery', deliveryFee: 5.65 } };
    const user = { location: { latitude: 48.83, longitude: 2.32 } };
    expect(migration20.shouldRecalculateDeliveryFee(order, user, 7.63)).toBe(true);
    expect(migration20.shouldRecalculateDeliveryFee(order, user, 5.65)).toBe(false);
  });
});
