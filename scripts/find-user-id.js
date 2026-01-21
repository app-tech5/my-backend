const { MongoClient } = require('mongodb');

async function findUserId() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db('good-foods');
    const usersCollection = db.collection('users');

    // Chercher l'utilisateur demo@customer.com
    const user = await usersCollection.findOne({ email: 'demo@customer.com' });

    if (user) {
      console.log('🔍 Utilisateur trouvé:');
      console.log('  - ID:', user._id.toString());
      console.log('  - Email:', user.email);
      console.log('  - Name:', user.name);
      console.log('  - Role:', user.role);
    } else {
      console.log('❌ Utilisateur demo@customer.com non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

findUserId();






