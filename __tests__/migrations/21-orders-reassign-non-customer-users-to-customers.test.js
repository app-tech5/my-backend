const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/21-orders-reassign-non-customer-users-to-customers');

describe('migration 21-orders-reassign-non-customer-users-to-customers', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-21');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('reassigns orders from drivers to multiple customers', async () => {
    const driverUserId = new ObjectId();
    const driverProfileId = new ObjectId();
    const restaurantId = new ObjectId();
    const customerA = new ObjectId();
    const customerB = new ObjectId();
    const customerC = new ObjectId();

    await db.collection('users').insertMany([
    {
      _id: driverUserId,
      role: 'delivery',
      name: 'Jean Dupont',
      address: 'Driver addr',
      location: { latitude: 48.99, longitude: 2.41 }
    },
    {
      _id: customerA,
      role: 'customer',
      name: 'Alice',
      address: '10 Rue A, 75001 Paris',
      location: { latitude: 48.86, longitude: 2.34 }
    },
    {
      _id: customerB,
      role: 'customer',
      name: 'Bob',
      address: '20 Rue B, 75002 Paris',
      location: { latitude: 48.87, longitude: 2.35 }
    },
    {
      _id: customerC,
      role: 'customer',
      name: 'Carol',
      address: '30 Rue C, 75003 Paris',
      location: { latitude: 48.88, longitude: 2.36 }
    }]
    );

    await db.collection('drivers').insertOne({
      _id: driverProfileId,
      userId: driverUserId
    });

    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      latitude: '48.8729866',
      longitude: '2.3409458'
    });

    await db.collection('deliverysettings').insertOne({
      restaurant: restaurantId,
      isDeliveryEnabled: true,
      deliveryFeeType: 'FIXED',
      fixedDeliveryFee: 3.5,
      freeDeliveryThreshold: 25
    });

    const orderIds = Array.from({ length: 6 }, () => new ObjectId());
    await db.collection('orders').insertMany(
      orderIds.map((id) => ({
        _id: id,
        user: driverUserId,
        driver: driverProfileId,
        restaurant: restaurantId,
        subtotal: 10,
        tax: { rate: 0.1, amount: 1 },
        delivery: { type: 'delivery', address: 'Wrong', deliveryFee: 0 },
        totalPrice: 11
      }))
    );

    await migration.up(db);

    const orders = await db.collection('orders').find({}).toArray();
    const assignedUsers = orders.map((order) => String(order.user));

    expect(assignedUsers.every((id) => id !== String(driverUserId))).toBe(true);
    expect(new Set(assignedUsers).size).toBeGreaterThan(1);
    orders.forEach((order) => {
      expect(order.delivery.address).toMatch(/Paris$/);
    });
  });

  it('does not touch orders that already have a customer user', async () => {
    const customerId = new ObjectId();
    const orderId = new ObjectId();

    await db.collection('users').insertOne({
      _id: customerId,
      role: 'customer',
      name: 'Alice',
      address: 'Paris'
    });

    await db.collection('orders').insertOne({
      _id: orderId,
      user: customerId,
      subtotal: 10,
      tax: { rate: 0.1, amount: 1 },
      delivery: { type: 'delivery', deliveryFee: 3 },
      totalPrice: 14
    });

    await migration.up(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(String(order.user)).toBe(String(customerId));
  });

  it('restores previous user on down', async () => {
    const driverUserId = new ObjectId();
    const customerId = new ObjectId();
    const orderId = new ObjectId();

    await db.collection('users').insertMany([
    { _id: driverUserId, role: 'delivery', name: 'Driver' },
    { _id: customerId, role: 'customer', name: 'Alice', address: 'Paris' }]
    );

    await db.collection('orders').insertOne({
      _id: orderId,
      user: driverUserId,
      subtotal: 10,
      tax: { rate: 0.1, amount: 1 },
      delivery: { type: 'delivery', deliveryFee: 0 },
      totalPrice: 11
    });

    await migration.up(db);
    await migration.down(db);

    const order = await db.collection('orders').findOne({ _id: orderId });
    expect(String(order.user)).toBe(String(driverUserId));
  });
});
