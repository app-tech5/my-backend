const { MongoClient } = require('mongodb');
async function addUserLocationField() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const updateResult = await usersCollection.updateMany(
      { location: { $exists: false } },
      {
        $set: {
          location: {
            latitude: null,
            longitude: null
          },
          updatedAt: new Date()
        }
      }
    );
    const users = await usersCollection.find({}).limit(3).toArray();
  } catch (error) {
    throw error;
  } finally {
    await client.close();
  }
}
addUserLocationField();
