const { MongoClient } = require('mongodb');

async function addUserLocationField() {
  
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log('🔍 Migration: Ajout du champ location aux utilisateurs existants');
  console.log('Utilisation de:', mongoUri);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

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

    console.log(`✅ Migration terminée: ${updateResult.modifiedCount} utilisateurs mis à jour`);
    
    const users = await usersCollection.find({}).limit(3).toArray();
    users.forEach(user => {
      console.log(`👤 ${user.name} (${user.email}): location =`, user.location);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

addUserLocationField();

