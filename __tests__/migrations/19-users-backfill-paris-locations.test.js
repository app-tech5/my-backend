const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/19-users-backfill-paris-locations');

describe('migration 19-users-backfill-paris-locations', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-19');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('assigns distinct Paris locations to users missing location', async () => {
    const usersCol = db.collection('users');
    await usersCol.insertMany([
    {
      _id: new ObjectId(),
      role: 'customer',
      name: 'Alice',
      address: 'Old address 1'
    },
    {
      _id: new ObjectId(),
      role: 'customer',
      name: 'Bob',
      address: 'Old address 2'
    }]
    );

    await migration.up(db);

    const updated = await usersCol.find({ role: 'customer' }).sort({ _id: 1 }).toArray();

    expect(updated).toHaveLength(2);
    updated.forEach((user) => {
      expect(migration.hasValidLocation(user)).toBe(true);
      expect(user.address).toMatch(/Paris$/);
    });

    const coords = updated.map((u) => `${u.location.latitude},${u.location.longitude}`);
    expect(new Set(coords).size).toBe(2);
  });

  it('does not modify users who already have a valid location', async () => {
    const usersCol = db.collection('users');
    const existing = {
      _id: new ObjectId(),
      role: 'customer',
      name: 'Carol',
      address: '12 Rue de Rivoli, 75001 Paris',
      location: { latitude: 48.8556, longitude: 2.3601 }
    };
    await usersCol.insertOne(existing);

    await migration.up(db);

    const user = await usersCol.findOne({ _id: existing._id });
    expect(user.address).toBe(existing.address);
    expect(user.location).toEqual(existing.location);
  });

  it('restores previous address and removes location on down', async () => {
    const usersCol = db.collection('users');
    const userId = new ObjectId();
    await usersCol.insertOne({
      _id: userId,
      role: 'customer',
      name: 'Jeff',
      address: '1088 Molly Coves, North Jesseborough'
    });

    await migration.up(db);
    await migration.down(db);

    const user = await usersCol.findOne({ _id: userId });
    expect(user.address).toBe('1088 Molly Coves, North Jesseborough');
    expect(user.location).toBeUndefined();
  });

  it('buildParisLocationPool generates enough distinct locations for many users', () => {
    const pool = migration.buildParisLocationPool(55);
    expect(pool).toHaveLength(55);

    const keys = new Set(pool.map((spot) => `${spot.latitude},${spot.longitude}`));
    expect(keys.size).toBe(55);
    pool.forEach((spot) => {
      expect(spot.address).toMatch(/Paris$/);
      expect(spot.latitude).toBeGreaterThan(48.81);
      expect(spot.latitude).toBeLessThan(48.91);
    });
  });
});
