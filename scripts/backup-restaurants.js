require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const loadModels = require('../src/utils/loadModels');
const connectDB = async () => {
  try {
    console.log('🔍 VÉRIFICATION VARIABLE ENV MONGO_URI:');
    console.log('process.env.MONGO_URI:', process.env.MONGO_URI);
    console.log('Type:', typeof process.env.MONGO_URI);
    console.log('Est défini:', !!process.env.MONGO_URI);
    console.log('Longueur:', process.env.MONGO_URI?.length || 0);
    const mongoUri = 'mongodb://localhost:27017/good-foods';
    console.log('🔗 URI MongoDB utilisée:', mongoUri);
    console.log('🔗 Variables d\'environnement MONGO_URI:', process.env.MONGO_URI || 'NON DÉFINIE');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');
    loadModels();
    console.log('📊 Base de données connectée:', mongoose.connection.db.databaseName);
    console.log('📊 État de la connexion:', mongoose.connection.readyState);
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};
const backupRestaurants = async () => {
  try {
    console.log('🔄 Création du backup de la collection restaurants...');
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      console.log('📁 Dossier backups créé');
    }
    console.log('🔍 Vérification de la connexion DB...');
    const dbState = mongoose.connection.readyState;
    console.log(`📊 État de la DB: ${dbState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    console.log('📋 Chargement du modèle Restaurant...');
    const Restaurant = require('../src/models/Restaurant');
    console.log('✅ Modèle Restaurant chargé');
    console.log('🔍 Recherche des restaurants...');
    const restaurants = await Restaurant.find({}).lean();
    console.log(`📊 Restaurant.find({}) retourné: ${restaurants.length} restaurants`);
    if (restaurants.length > 0) {
      console.log('📋 Premier restaurant trouvé:');
      console.log(`- ID: ${restaurants[0]._id}`);
      console.log(`- Nom: ${restaurants[0].name}`);
      console.log(`- Catégories: ${restaurants[0].categories?.length || 0}`);
    } else {
      console.log('❌ Aucun restaurant trouvé avec Mongoose');
    }
    console.log('🔍 Test avec collection native...');
    const nativeRestaurants = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log(`📊 Collection native: ${nativeRestaurants.length} restaurants`);
    if (nativeRestaurants.length > 0) {
      console.log('📋 Premier restaurant trouvé (natif):');
      console.log(`- ID: ${nativeRestaurants[0]._id}`);
      console.log(`- Nom: ${nativeRestaurants[0].name}`);
    } else {
      console.log('❌ Aucun restaurant trouvé avec collection native');
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `restaurants-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(restaurants, null, 2));
    console.log(`✅ Backup créé: ${filename}`);
    console.log(`📊 ${restaurants.length} restaurants sauvegardés`);
    console.log(`📍 Fichier: ${filepath}`);
    if (restaurants.length > 0) {
      console.log('📋 Exemple du premier restaurant:');
      console.log(`Nom: ${restaurants[0].name}`);
      console.log(`Catégories: ${restaurants[0].categories?.length || 0}`);
    }
    return filepath;
  } catch (error) {
    console.error('❌ Erreur lors du backup:', error);
    throw error;
  }
};
const runScript = async () => {
  await connectDB();
  await backupRestaurants();
  await mongoose.connection.close();
  console.log('🎉 Backup terminé avec succès !');
};
runScript().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
