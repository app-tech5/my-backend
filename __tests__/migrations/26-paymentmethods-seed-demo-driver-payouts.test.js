const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/26-paymentmethods-seed-demo-driver-payouts');

describe('migration 26-paymentmethods-seed-demo-driver-payouts', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-26');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('seeds stripe connect and paypal payout methods for the demo driver user', async () => {
    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      email: 'driver@demo.com',
      role: 'delivery',
      stripeConnectAccountId: '',
    });

    await migration.up(db);

    const methods = await db
      .collection('paymentmethods')
      .find({ migrationSeedKey: migration.SEED_KEY })
      .sort({ isDefault: -1 })
      .toArray();

    expect(methods).toHaveLength(2);

    const stripeMethod = methods.find((method) => method.methodType === 'bank_transfer');
    const paypalMethod = methods.find((method) => method.methodType === 'paypal');

    expect(stripeMethod).toMatchObject({
      _id: migration.DEMO_PM_STRIPE_ID,
      id: `stripe_connect_${migration.DEMO_STRIPE_CONNECT_ACCOUNT_ID}`,
      user: migration.DEMO_USER_ID,
      purpose: 'payout',
      isDefault: true,
      stripeConnectAccountId: migration.DEMO_STRIPE_CONNECT_ACCOUNT_ID,
      bankDetails: {
        accountHolderName: 'Jean Dupont',
        ibanLast4: '7890',
        bankName: 'BNP Paribas',
      },
    });
    expect(stripeMethod.bankDetails.iban).toBeUndefined();

    expect(paypalMethod).toMatchObject({
      _id: migration.DEMO_PM_PAYPAL_ID,
      user: migration.DEMO_USER_ID,
      purpose: 'payout',
      isDefault: false,
      paypalEmail: 'driver.paypal@demo.com',
    });

    const user = await db.collection('users').findOne({ _id: migration.DEMO_USER_ID });
    expect(user.stripeConnectAccountId).toBe(migration.DEMO_STRIPE_CONNECT_ACCOUNT_ID);
  });

  it('is idempotent', async () => {
    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      email: 'driver@demo.com',
      role: 'delivery',
    });

    await migration.up(db);
    await migration.up(db);

    const count = await db.collection('paymentmethods').countDocuments({
      migrationSeedKey: migration.SEED_KEY,
    });

    expect(count).toBe(2);
  });

  it('skips when demo user is missing', async () => {
    await migration.up(db);

    const count = await db.collection('paymentmethods').countDocuments({
      migrationSeedKey: migration.SEED_KEY,
    });

    expect(count).toBe(0);
  });

  it('removes seeded payout methods on down', async () => {
    await db.collection('users').insertOne({
      _id: migration.DEMO_USER_ID,
      email: 'driver@demo.com',
      role: 'delivery',
      stripeConnectAccountId: '',
    });

    await migration.up(db);
    await migration.down(db);

    const count = await db.collection('paymentmethods').countDocuments({
      migrationSeedKey: migration.SEED_KEY,
    });
    const user = await db.collection('users').findOne({ _id: migration.DEMO_USER_ID });

    expect(count).toBe(0);
    expect(user.stripeConnectAccountId).toBe('');
  });
});
