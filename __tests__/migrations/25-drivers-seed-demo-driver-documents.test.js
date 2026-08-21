const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/25-drivers-seed-demo-driver-documents');

describe('migration 25-drivers-seed-demo-driver-documents', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-25');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('replaces placeholder documents with demo public image URLs', async () => {
    await db.collection('drivers').insertOne({
      _id: migration.DEMO_DRIVER_ID,
      user: new ObjectId(),
      documents: [
      { type: 'driver_license', fileUrl: 'https://example.com/license.pdf' },
      { type: 'insurance', fileUrl: 'https://example.com/insurance.pdf' }],

      isApproved: false
    });

    await migration.up(db);

    const driver = await db.collection('drivers').findOne({ _id: migration.DEMO_DRIVER_ID });
    const expected = migration.buildDemoDriverDocuments('http://localhost:5000');

    expect(driver.documents).toEqual(expected);
    expect(driver.isApproved).toBe(true);
    expect(driver.documents.every((doc) => !doc.fileUrl.includes('example.com'))).toBe(true);
    expect(
      driver.documents.every((doc) => doc.fileUrl.includes('/api/public/driver-documents/demo-'))
    ).toBe(true);
  });

  it('is idempotent', async () => {
    await db.collection('drivers').insertOne({
      _id: migration.DEMO_DRIVER_ID,
      user: new ObjectId(),
      documents: [{ type: 'identity_card', fileUrl: 'https://example.com/id.pdf' }],
      isApproved: false
    });

    await migration.up(db);
    await migration.up(db);

    const backups = await db.collection(migration.BACKUP_COLLECTION).find({}).toArray();
    expect(backups).toHaveLength(1);
  });

  it('restores previous documents on down', async () => {
    const previousDocuments = [
    { type: 'driver_license', fileUrl: 'https://example.com/license.pdf' }];

    await db.collection('drivers').insertOne({
      _id: migration.DEMO_DRIVER_ID,
      user: new ObjectId(),
      documents: previousDocuments,
      isApproved: false
    });

    await migration.up(db);
    await migration.down(db);

    const driver = await db.collection('drivers').findOne({ _id: migration.DEMO_DRIVER_ID });
    const backupCount = await db.collection(migration.BACKUP_COLLECTION).countDocuments();

    expect(driver.documents).toEqual(previousDocuments);
    expect(driver.isApproved).toBe(false);
    expect(backupCount).toBe(0);
  });
});
