const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

async function updateRestaurantCoordinates() {
  // Utiliser directement l'URI MongoDB
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log('🔍 Utilisation de:', mongoUri);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    const restaurantsCollection = db.collection('restaurants');

    // Coordonnées de base pour l'utilisateur demo (Paris centre)
    const baseLatitude = 48.8566;
    const baseLongitude = 2.3522;

    // Générer des coordonnées proches pour quelques restaurants
    const nearbyCoordinates = [
      { latitude: baseLatitude + 0.001, longitude: baseLongitude + 0.001 }, // ~100m au nord-est
      { latitude: baseLatitude - 0.001, longitude: baseLongitude - 0.001 }, // ~100m au sud-ouest
      { latitude: baseLatitude + 0.002, longitude: baseLongitude - 0.001 }, // ~200m au nord-ouest
      { latitude: baseLatitude - 0.002, longitude: baseLongitude + 0.001 }, // ~200m au sud-est
      { latitude: baseLatitude + 0.0015, longitude: baseLongitude + 0.0005 }, // ~150m à l'est
      { latitude: baseLatitude - 0.0015, longitude: baseLongitude - 0.0005 }, // ~150m à l'ouest
      { latitude: baseLatitude + 0.0008, longitude: baseLongitude - 0.0012 }, // ~120m au nord-ouest
      { latitude: baseLatitude - 0.0008, longitude: baseLongitude + 0.0012 }, // ~120m au sud-est
    ];

    console.log('📍 Coordonnées de base pour l\'utilisateur demo:', { baseLatitude, baseLongitude });

    // Récupérer tous les restaurants
    const allRestaurants = await restaurantsCollection.find({}).toArray();
    console.log(`📊 ${allRestaurants.length} restaurants trouvés dans la base de données`);

    // Sélectionner les premiers restaurants (limiter à 8 pour correspondre au nombre de coordonnées)
    const restaurantsToUpdate = allRestaurants.slice(0, nearbyCoordinates.length);

    console.log(`🎯 Mise à jour de ${restaurantsToUpdate.length} restaurants avec des coordonnées proches`);

    // Mettre à jour chaque restaurant avec des coordonnées proches
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

    // Vérifier les mises à jour
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
