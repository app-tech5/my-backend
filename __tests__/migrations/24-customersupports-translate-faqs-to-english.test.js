const { MongoClient, ObjectId } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const migration = require('../../migrations/24-customersupports-translate-faqs-to-english');

describe('migration 24-customersupports-translate-faqs-to-english', () => {
  let mongoServer;
  let client;
  let db;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    client = new MongoClient(mongoServer.getUri());
    await client.connect();
    db = client.db('test-migration-24');
  }, 60000);

  afterAll(async () => {
    await client?.close();
    await mongoServer?.stop();
  }, 60000);

  beforeEach(async () => {
    await db.dropDatabase();
  });

  it('translates known French FAQ documents to English', async () => {
    const faqId = new ObjectId();
    const userId = new ObjectId();

    await db.collection('customersupports').insertOne({
      _id: faqId,
      type: 'faq',
      user: userId,
      question: "Où voir l'état de ma commande ?",
      answer: 'Allez dans Commandes pour suivre votre commande.',
      faq_category: 'delivery'
    });

    await migration.up(db);

    const updated = await db.collection('customersupports').findOne({ _id: faqId });

    expect(updated.question).toBe('Where can I see my order status?');
    expect(updated.answer).toContain('Orders section');

    const backup = await db.collection(migration.BACKUP_COLLECTION).findOne({ _id: faqId });
    expect(backup.previous.question).toBe("Où voir l'état de ma commande ?");
  });

  it('seeds driver FAQs in English when collection is empty', async () => {
    await db.collection('users').insertOne({
      _id: new ObjectId(),
      role: 'admin',
      email: 'admin@test.com'
    });

    await migration.up(db);

    const faqs = await db.collection('customersupports').find({ type: 'faq' }).toArray();

    expect(faqs).toHaveLength(migration.DRIVER_FAQS_EN.length);
    expect(faqs[0].question).toBe('How do I accept a delivery?');
  });

  it('restores previous FAQ content on down', async () => {
    const faqId = new ObjectId();
    const userId = new ObjectId();

    await db.collection('customersupports').insertOne({
      _id: faqId,
      type: 'faq',
      user: userId,
      question: "L'application ne fonctionne pas",
      answer: 'Redémarrez l application.',
      faq_category: 'other'
    });

    await migration.up(db);
    await migration.down(db);

    const restored = await db.collection('customersupports').findOne({ _id: faqId });

    expect(restored.question).toBe("L'application ne fonctionne pas");
    expect(restored.answer).toBe('Redémarrez l application.');
  });
});
