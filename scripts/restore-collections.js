const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function restoreCollections(backupTimestamp) {
  if (!backupTimestamp) {
    console.error('❌ Veuillez spécifier un timestamp de sauvegarde');
    console.log('Usage: node restore-collections.js <timestamp>');
    console.log('Exemple: node restore-collections.js 2024-01-15T10-30-00');
    process.exit(1);
  }

  // Utiliser directement l'URI MongoDB
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';

  console.log(`🔄 Restauration des collections depuis la sauvegarde: ${backupTimestamp}`);
  console.log('Utilisation de:', mongoUri);

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db(dbName);
    const backupDir = path.join(__dirname, '..', 'backups');

    // Chemins des fichiers de sauvegarde
    const usersBackupPath = path.join(backupDir, `backup-${backupTimestamp}-users.json`);
    const restaurantsBackupPath = path.join(backupDir, `backup-${backupTimestamp}-restaurants.json`);

    // Vérifier si les fichiers existent
    if (!fs.existsSync(usersBackupPath)) {
      console.error(`❌ Fichier de sauvegarde users introuvable: ${usersBackupPath}`);
      return;
    }
    if (!fs.existsSync(restaurantsBackupPath)) {
      console.error(`❌ Fichier de sauvegarde restaurants introuvable: ${restaurantsBackupPath}`);
      return;
    }

    // Charger les données depuis les fichiers JSON
    console.log('📂 Chargement des fichiers de sauvegarde...');
    const usersData = JSON.parse(fs.readFileSync(usersBackupPath, 'utf8'));
    const restaurantsData = JSON.parse(fs.readFileSync(restaurantsBackupPath, 'utf8'));

    // Restaurer la collection users
    console.log('👥 Restauration de la collection users...');
    const usersCollection = db.collection('users');
    await usersCollection.deleteMany({}); // Vider la collection
    await usersCollection.insertMany(usersData);
    console.log(`✅ ${usersData.length} utilisateurs restaurés`);

    // Restaurer la collection restaurants
    console.log('🏪 Restauration de la collection restaurants...');
    const restaurantsCollection = db.collection('restaurants');
    await restaurantsCollection.deleteMany({}); // Vider la collection
    await restaurantsCollection.insertMany(restaurantsData);
    console.log(`✅ ${restaurantsData.length} restaurants restaurés`);

    console.log('\n🎉 Restauration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}

// Récupérer le timestamp depuis les arguments de ligne de commande
const backupTimestamp = process.argv[2];
restoreCollections(backupTimestamp);
