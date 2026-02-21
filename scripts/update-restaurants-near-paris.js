const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
async function updateRestaurantsNearParis() {
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
    const parisRestaurants = [
      {
        name: "Le Petit Bistrot",
        latitude: baseLatitude + 0.0012,
        longitude: baseLongitude + 0.0008,
        description: "Restaurant français traditionnel"
      },
      {
        name: "Pizza Roma",
        latitude: baseLatitude - 0.0009,
        longitude: baseLongitude - 0.0011,
        description: "Authentic Italian pizza"
      },
      {
        name: "Sushi Zen",
        latitude: baseLatitude + 0.0021,
        longitude: baseLongitude - 0.0007,
        description: "Fresh sushi and Japanese cuisine"
      },
      {
        name: "Burger House",
        latitude: baseLatitude - 0.0018,
        longitude: baseLongitude + 0.0015,
        description: "Gourmet burgers and fries"
      },
      {
        name: "Taco Loco",
        latitude: baseLatitude + 0.0006,
        longitude: baseLongitude - 0.0020,
        description: "Mexican street food"
      },
      {
        name: "Café de Flore",
        latitude: baseLatitude + 0.0015,
        longitude: baseLongitude + 0.0013,
        description: "French café with pastries"
      },
      {
        name: "Thai Garden",
        latitude: baseLatitude - 0.0022,
        longitude: baseLongitude - 0.0009,
        description: "Authentic Thai cuisine"
      },
      {
        name: "Green Salad",
        latitude: baseLatitude + 0.0003,
        longitude: baseLongitude + 0.0018,
        description: "Healthy salads and bowls"
      }
    ];
    console.log('📍 Coordonnées de base pour Paris centre:', { baseLatitude, baseLongitude });
    const allRestaurants = await restaurantsCollection.find({}).toArray();
    console.log(`📊 ${allRestaurants.length} restaurants trouvés dans la base de données`);
    const restaurantsToUpdate = Math.min(parisRestaurants.length, allRestaurants.length);
    console.log(`🎯 Mise à jour de ${restaurantsToUpdate} restaurants avec des coordonnées à Paris`);
    for (let i = 0; i < restaurantsToUpdate; i++) {
      const restaurant = allRestaurants[i];
      const parisData = parisRestaurants[i];
      const updateResult = await restaurantsCollection.updateOne(
        { _id: restaurant._id },
        {
          $set: {
            name: parisData.name,
            latitude: parisData.latitude,
            longitude: parisData.longitude,
            description: parisData.description,
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ ${parisData.name}: ${parisData.latitude}, ${parisData.longitude} (${updateResult.modifiedCount > 0 ? 'mis à jour' : 'déjà à jour'})`);
    }
    console.log('\n🔍 Vérification des restaurants mis à jour:');
    const updatedRestaurants = await restaurantsCollection.find({
      latitude: { $exists: true },
      longitude: { $exists: true }
    }).limit(10).toArray();
    updatedRestaurants.forEach(restaurant => {
      console.log(`📍 ${restaurant.name}: ${restaurant.latitude}, ${restaurant.longitude}`);
    });
    console.log(`\n✅ Script terminé ! ${restaurantsToUpdate} restaurants ont été mis à jour avec des coordonnées à Paris.`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}
updateRestaurantsNearParis();
