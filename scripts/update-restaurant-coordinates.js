const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
async function updateRestaurantCoordinates() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';
  console.log('🔍 Utilisation de:', mongoUri);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    const db = client.db(dbName);
    const restaurantsCollection = db.collection('restaurants');
    const baseLatitude = 48.8566;
    const baseLongitude = 2.3522;
    const nearbyCoordinates = [
      { latitude: baseLatitude + 0.001, longitude: baseLongitude + 0.001 }, 
      { latitude: baseLatitude - 0.001, longitude: baseLongitude - 0.001 }, 
      { latitude: baseLatitude + 0.002, longitude: baseLongitude - 0.001 }, 
      { latitude: baseLatitude - 0.002, longitude: baseLongitude + 0.001 }, 
      { latitude: baseLatitude + 0.0015, longitude: baseLongitude + 0.0005 }, 
      { latitude: baseLatitude - 0.0015, longitude: baseLongitude - 0.0005 }, 
      { latitude: baseLatitude + 0.0008, longitude: baseLongitude - 0.0012 }, 
      { latitude: baseLatitude - 0.0008, longitude: baseLongitude + 0.0012 }, 
    ];
    console.log('📍 Coordonnées de base pour l\'utilisateur demo:', { baseLatitude, baseLongitude });
    const allRestaurants = await restaurantsCollection.find({}).toArray();
    console.log(`📊 ${allRestaurants.length} restaurants trouvés dans la base de données`);
    const restaurantsToUpdate = allRestaurants.slice(0, nearbyCoordinates.length);
    console.log(`🎯 Mise à jour de ${restaurantsToUpdate.length} restaurants avec des coordonnées proches`);
    for (let i = 0; i < restaurantsToUpdate.length; i++) {
      const restaurant = restaurantsToUpdate[i];
      const coordinates = nearbyCoordinates[i];
      const updateResult = await restaurantsCollection.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ ${restaurant.name || restaurant._id}: ${coordinates.latitude}, ${coordinates.longitude} (${updateResult.modifiedCount > 0 ? 'mis à jour' : 'déjà à jour'})`);
    }
    console.log('\n🔍 Vérification des mises à jour:');
    const updatedRestaurants = await restaurantsCollection.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).limit(10).toArray();
    updatedRestaurants.forEach(restaurant => {
      console.log(`📍 ${restaurant.name}: ${restaurant.latitude}, ${restaurant.longitude}`);
    });
    console.log(`\n✅ Script terminé ! ${restaurantsToUpdate.length} restaurants ont été mis à jour avec des coordonnées proches de l'utilisateur demo.`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}
updateRestaurantCoordinates();
