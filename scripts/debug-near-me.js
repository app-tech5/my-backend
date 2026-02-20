const { MongoClient } = require('mongodb');

async function debugNearMe() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log('🔍 Debug de la fonctionnalité "Near Me"');

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    
    console.log('\n👤 Vérification de l\'utilisateur demo:');
    const demoUser = await db.collection('users').findOne({ email: 'demo@customer.com' });
    if (demoUser) {
      console.log(`✅ Utilisateur trouvé: ${demoUser.name}`);
      console.log(`📍 Location:`, demoUser.location);
    } else {
      console.log('❌ Utilisateur demo non trouvé');
    }
    
    console.log('\n🏪 Vérification des restaurants:');
    const restaurantsWithCoords = await db.collection('restaurants')
      .find({
        latitude: { $exists: true },
        longitude: { $exists: true }
      })
      .project({ name: 1, latitude: 1, longitude: 1 })
      .limit(10)
      .toArray();

    console.log(`📊 ${restaurantsWithCoords.length} restaurants avec coordonnées:`);
    restaurantsWithCoords.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name}: ${restaurant.latitude}, ${restaurant.longitude}`);
    });
    
    if (demoUser?.location && restaurantsWithCoords.length > 0) {
      console.log('\n📏 Distances depuis la position utilisateur:');
      const userLat = demoUser.location.latitude;
      const userLon = demoUser.location.longitude;

      restaurantsWithCoords.forEach((restaurant, index) => {
        const distance = getDistanceFromLatLonInKm(
          userLat, userLon,
          restaurant.latitude, restaurant.longitude
        );
        console.log(`  ${index + 1}. ${restaurant.name}: ${distance.toFixed(2)} km`);
      });
    }
    
    if (demoUser?.location) {
      console.log('\n🎯 Restaurants dans un rayon de 10km:');
      const userLat = demoUser.location.latitude;
      const userLon = demoUser.location.longitude;

      const nearbyRestaurants = restaurantsWithCoords.filter(restaurant => {
        const distance = getDistanceFromLatLonInKm(
          userLat, userLon,
          restaurant.latitude, restaurant.longitude
        );
        return distance <= 10;
      });

      console.log(`📍 ${nearbyRestaurants.length} restaurants trouvés dans un rayon de 10km`);
      nearbyRestaurants.forEach((restaurant, index) => {
        const distance = getDistanceFromLatLonInKm(
          userLat, userLon,
          restaurant.latitude, restaurant.longitude
        );
        console.log(`  ${index + 1}. ${restaurant.name}: ${distance.toFixed(2)} km`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

debugNearMe();

