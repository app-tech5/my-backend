const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

async function insertDemoUser() {
  // Utiliser directement l'URI MongoDB
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log('🔍 Utilisation de:', mongoUri);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await usersCollection.findOne({ email: 'demo@customer.com' });
    if (existingUser) {
      console.log('ℹ️ Utilisateur demo@customer.com existe déjà');
      return;
    }

    // Créer l'utilisateur de démo
    const demoCustomer = {
      _id: new ObjectId('67c62fae5a9b19466ee230d7'),
      email: "demo@customer.com",
      password: bcrypt.hashSync('demo123', 10),
      name: "Demo Customer",
      phone: "+33123456789",
      image: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/42.jpg",
      address: "456 Demo Street, Paris",
      location: {
        latitude: 48.8566,  // Latitude de Paris centre
        longitude: 2.3522   // Longitude de Paris centre
      },
      role: "customer",
      isActive: true,
      favorites: [],
      paymentMethods: [{
        type: "card",
        details: {
          last4: "1234",
          brand: "mastercard"
        }
      }],
      ratings: { asCustomer: 4.5 },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(demoCustomer);
    console.log('✅ Utilisateur de démo inséré avec succès:', result.insertedId);

    // Vérifier l'insertion
    const insertedUser = await usersCollection.findOne({ email: 'demo@customer.com' });
    console.log('🔍 Utilisateur trouvé:', {
      email: insertedUser.email,
      name: insertedUser.name,
      role: insertedUser.role
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

insertDemoUser();
