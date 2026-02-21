const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
async function updateDemoUserLocation() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';
  console.log('🔍 Utilisation de:', mongoUri);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    const demoLocation = {
      latitude: 48.8566,  
      longitude: 2.3522   
    };
    console.log('📍 Coordonnées de localisation pour l\'utilisateur demo:', demoLocation);
    const updateResult = await usersCollection.updateOne(
      { email: 'demo@customer.com' },
      {
        $set: {
          location: demoLocation,
          updatedAt: new Date()
        }
      }
    );
    console.log(`✅ Utilisateur demo mis à jour: ${updateResult.modifiedCount > 0 ? 'succès' : 'aucune modification'}`);
    const updatedUser = await usersCollection.findOne({ email: 'demo@customer.com' });
    if (updatedUser) {
      console.log('🔍 Utilisateur demo après mise à jour:', {
        email: updatedUser.email,
        name: updatedUser.name,
        location: updatedUser.location
      });
    } else {
      console.log('❌ Utilisateur demo non trouvé');
    }
    console.log('\n✅ Script terminé ! L\'utilisateur demo a été mis à jour avec des coordonnées de localisation.');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}
updateDemoUserLocation();
