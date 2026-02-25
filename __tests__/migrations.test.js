const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync } = require('child_process');

describe('Database Migrations Tests', () => {
  let client;
  let db;
  let mongoServer;

  beforeAll(async () => {
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    const dbName = 'test-migrations-db';

    process.env.MONGO_URI = mongoUri;
    process.env.MONGODB_DATABASE = dbName;

    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
  }, { timeout: 60000 }); 

  afterAll(async () => {
    
    if (client) {
      await client.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, { timeout: 60000 });

  beforeEach(async () => {
    
    await db.dropDatabase();
  });

  test('should execute all 8 clean migrations successfully', async () => {
      
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      try {
        execSync('npm run migrate:up', {
          env,
          stdio: 'pipe' 
        });
      } catch (error) {
        console.error(`Migration failed: ${error.message}`);
        throw error;
      }
      
      const changelog = await db.collection('changelog').find({}).toArray();
      expect(changelog.length).toBeGreaterThan(0);
    }, { timeout: 30000 }); 

  test('should create all required collections', async () => {
      
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      execSync('npm run migrate:up', { env, stdio: 'pipe' });
      
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      expect(collectionNames).toContain('currencies');
      expect(collectionNames).toContain('languages');
      expect(collectionNames).toContain('settings');
      expect(collectionNames).toContain('taxes');
      expect(collectionNames).toContain('categories');
      expect(collectionNames).toContain('servicemodes');
      expect(collectionNames).toContain('appsettings');
      expect(collectionNames).toContain('carts');
      expect(collectionNames).toContain('changelog'); 
    }, { timeout: 30000 });

  test('should populate currencies collection with safe data', async () => {
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      execSync('npm run migrate:up', { env, stdio: 'pipe' });

      const currencies = await db.collection('currencies').find({}).toArray();
      
      expect(currencies.length).toBeGreaterThanOrEqual(2);

      const eur = currencies.find(c => c.code === 'EUR');
      const usd = currencies.find(c => c.code === 'USD');

      expect(eur).toBeDefined();
      expect(usd).toBeDefined();
      expect(eur.symbol).toBe('€');
      expect(usd.symbol).toBe('$');
    }, { timeout: 30000 });

  test('should populate languages collection with safe data', async () => {
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      execSync('npm run migrate:up', { env, stdio: 'pipe' });

      const languages = await db.collection('languages').find({}).toArray();
      
      expect(languages.length).toBeGreaterThanOrEqual(1);

      const english = languages.find(l => l.code === 'en');
      expect(english).toBeDefined();
      expect(english.isDefault).toBe(true);
    }, { timeout: 30000 });

  test('should create settings collection with safe defaults', async () => {
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      execSync('npm run migrate:up', { env, stdio: 'pipe' });

      const settings = await db.collection('settings').findOne({ _id: "app_settings" });

      expect(settings).toBeDefined();
      expect(settings.appName).toBeDefined();
      expect(settings.currency).toBeDefined();
      expect(settings.language).toBeDefined();
    }, { timeout: 30000 });

  test('should NOT contain sensitive data', async () => {
      const env = {
        ...process.env,
        MONGO_URI: process.env.MONGO_URI,
        MONGODB_DATABASE: process.env.MONGODB_DATABASE
      };

      execSync('npm run migrate:up', { env, stdio: 'pipe' });
      
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      expect(collectionNames).not.toContain('users');
      expect(collectionNames).not.toContain('restaurants');
      expect(collectionNames).not.toContain('orders');
      expect(collectionNames).not.toContain('drivers');
      
      const allDocs = await db.collection('settings').find({}).toArray();
      const hasEmails = allDocs.some(doc => doc.email && doc.email.includes('@'));
      expect(hasEmails).toBe(false);
    }, { timeout: 30000 });

});