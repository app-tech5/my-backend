const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/31-admin-marketing-fill-empty-coherent-fields');

describe('migration 31-admin-marketing-fill-empty-coherent-fields', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-31');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('rewrites restaurant categories to live category ids and restores on down', async () => {
    const frenchId = new ObjectId();
    const asianId = new ObjectId();
    const staleId = new ObjectId();
    const restaurantId = new ObjectId();
    const productId = new ObjectId();
    const taxId = new ObjectId();
    const userId = new ObjectId();
    const txId = new ObjectId();

    await db.collection('categories').insertMany([
      {
        _id: frenchId,
        name: 'French',
        image: 'https://example.com/french.jpg',
      },
      {
        _id: asianId,
        name: 'Asian',
        image: 'https://example.com/asian.jpg',
      },
    ]);

    await db.collection('taxes').insertOne({
      _id: taxId,
      name: 'VAT',
      location: 'France',
      rate: 21.8,
    });

    await db.collection('restaurants').insertOne({
      _id: restaurantId,
      name: 'Sakura Sushi',
      categories: [
        {
          title: 'American',
          label: null,
          value: staleId,
          alias: 'stale',
          image: '',
        },
      ],
      description: 'Cibus tyrannus contego',
      phone: '1-560-508-9131 x674',
      display_phone: '',
      tax: { label: 'GST' },
      serviceModes: 'pickup',
    });

    await db.collection('products').insertOne({
      _id: productId,
      name: 'Sushi Bowl',
      restaurant: restaurantId,
      category: staleId,
    });

    await db.collection('users').insertOne({
      _id: userId,
      role: 'customer',
      phone: '(821) 734-1283 x898',
    });

    await db.collection('transactions').insertOne({
      _id: txId,
      transaction_type: 'tip',
      amount: 166.7962438049255,
      status: 'pending',
      payment_method: 'not_applicable',
      platform_fee: { amount: 16.68, percentage: 10 },
      processor_fee: { amount: 3.34 },
      tax: { amount: 13.34 },
    });

    await migration.up(db);

    const restaurant = await db.collection('restaurants').findOne({ _id: restaurantId });
    expect(restaurant.migrationSeedKey).toBe(migration.SEED_KEY);
    expect(restaurant.categories).toHaveLength(1);
    expect(String(restaurant.categories[0].value)).toBe(String(asianId));
    expect(restaurant.categories[0].label).toBe('Asian');
    expect(restaurant.phone).toMatch(/^01 /);
    expect(restaurant.description).toMatch(/sushi/i);
    expect(restaurant.tax.label).toBe('VAT');

    const product = await db.collection('products').findOne({ _id: productId });
    expect(String(product.category)).toBe(String(asianId));

    const user = await db.collection('users').findOne({ _id: userId });
    expect(user.phone).toMatch(/^06 /);

    const tx = await db.collection('transactions').findOne({ _id: txId });
    expect(tx.amount).toBeLessThan(20);
    expect(tx.payment_method).toBe('credit_card');
    expect(tx.status).toBe('completed');

    const tax = await db.collection('taxes').findOne({ _id: taxId });
    expect(tax.rate).toBe(20);

    await migration.down(db);

    const restoredRestaurant = await db.collection('restaurants').findOne({ _id: restaurantId });
    expect(restoredRestaurant.migrationSeedKey).toBeUndefined();
    expect(String(restoredRestaurant.categories[0].value)).toBe(String(staleId));
    expect(restoredRestaurant.phone).toBe('1-560-508-9131 x674');

    const restoredTx = await db.collection('transactions').findOne({ _id: txId });
    expect(restoredTx.amount).toBeCloseTo(166.7962438049255);
  });
});
