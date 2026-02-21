const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
async function backupCollections(db) {
  console.log('📤 Création d\'une sauvegarde automatique...');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFileName = `backup-${timestamp}`;
  const users = await db.collection('users').find({}).toArray();
  fs.writeFileSync(
    path.join(backupDir, `${backupFileName}-users.json`),
    JSON.stringify(users, null, 2)
  );
  const restaurants = await db.collection('restaurants').find({}).toArray();
  fs.writeFileSync(
    path.join(backupDir, `${backupFileName}-restaurants.json`),
    JSON.stringify(restaurants, null, 2)
  );
  console.log(`✅ Sauvegarde créée: ${backupFileName}`);
  return backupFileName;
}
async function setupNearMeFunctionality() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';
  console.log('🚀 Configuration de la fonctionnalité "Near Me"');
  console.log('🔍 Utilisation de:', mongoUri);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    const db = client.db(dbName);
    const backupName = await backupCollections(db);
    const usersCollection = db.collection('users');
    const restaurantsCollection = db.collection('restaurants');
    console.log('\n📍 1. Mise à jour de l\'utilisateur demo...');
    const demoLocation = {
      latitude: 48.8566,  
      longitude: 2.3522   
    };
    const userUpdate = await usersCollection.updateOne(
      { email: 'demo@customer.com' },
      {
        $set: {
          location: demoLocation,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Utilisateur demo: ${userUpdate.modifiedCount > 0 ? 'mis à jour' : 'déjà à jour'}`);
    console.log('\n👥 2. Migration des utilisateurs existants...');
    const userMigration = await usersCollection.updateMany(
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
    console.log(`✅ ${userMigration.modifiedCount} utilisateurs migrés`);
    console.log('\n🏪 3. Mise à jour des restaurants avec coordonnées Paris...');
    const baseLatitude = 48.8566;
    const baseLongitude = 2.3522;
    const parisRestaurants = [
      { name: "Le Petit Bistrot", lat: baseLatitude + 0.0012, lng: baseLongitude + 0.0008 },
      { name: "Pizza Roma", lat: baseLatitude - 0.0009, lng: baseLongitude - 0.0011 },
      { name: "Sushi Zen", lat: baseLatitude + 0.0021, lng: baseLongitude - 0.0007 },
      { name: "Burger House", lat: baseLatitude - 0.0018, lng: baseLongitude + 0.0015 },
      { name: "Taco Loco", lat: baseLatitude + 0.0006, lng: baseLongitude - 0.0020 },
      { name: "Café de Flore", lat: baseLatitude + 0.0015, lng: baseLongitude + 0.0013 },
      { name: "Thai Garden", lat: baseLatitude - 0.0022, lng: baseLongitude - 0.0009 },
      { name: "Green Salad", lat: baseLatitude + 0.0003, lng: baseLongitude + 0.0018 }
    ];
    const allRestaurants = await restaurantsCollection.find({}).toArray();
    const restaurantsToUpdate = Math.min(parisRestaurants.length, allRestaurants.length);
    for (let i = 0; i < restaurantsToUpdate; i++) {
      const restaurant = allRestaurants[i];
      const parisData = parisRestaurants[i];
      await restaurantsCollection.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            name: parisData.name,
            latitude: parisData.lat,
            longitude: parisData.lng,
            updatedAt: new Date()
          }
        }
      );
    }
    console.log(`✅ ${restaurantsToUpdate} restaurants mis à jour`);
    console.log('\n🔍 Vérification finale:');
    const demoUser = await usersCollection.findOne({ email: 'demo@customer.com' });
    console.log(`👤 Utilisateur demo - Location: ${JSON.stringify(demoUser?.location)}`);
    const restaurants = await restaurantsCollection.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).limit(5).toArray();
    console.log('🏪 Restaurants avec coordonnées:');
    restaurants.forEach(r => {
      console.log(`  - ${r.name}: ${r.latitude}, ${r.longitude}`);
    });
    console.log('\n🎉 Configuration terminée ! La fonctionnalité "Near Me" est maintenant opérationnelle.');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}
setupNearMeFunctionality();
