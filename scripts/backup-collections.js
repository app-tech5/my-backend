const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
async function backupCollections() {
  const mongoUri = 'mongodb://127.0.0.1:27017/good-foods';
  const dbName = 'good-foods';
  console.log('🔍 Sauvegarde des collections users et restaurants');
  console.log('Utilisation de:', mongoUri);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    const db = client.db(dbName);
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `backup-${timestamp}`;
    console.log('📤 Sauvegarde de la collection users...');
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    const usersBackupPath = path.join(backupDir, `${backupFileName}-users.json`);
    fs.writeFileSync(usersBackupPath, JSON.stringify(users, null, 2));
    console.log(`✅ Collection users sauvegardée: ${users.length} documents`);
    console.log(`📁 Fichier: ${usersBackupPath}`);
    console.log('🏪 Sauvegarde de la collection restaurants...');
    const restaurantsCollection = db.collection('restaurants');
    const restaurants = await restaurantsCollection.find({}).toArray();
    const restaurantsBackupPath = path.join(backupDir, `${backupFileName}-restaurants.json`);
    fs.writeFileSync(restaurantsBackupPath, JSON.stringify(restaurants, null, 2));
    console.log(`✅ Collection restaurants sauvegardée: ${restaurants.length} documents`);
    console.log(`📁 Fichier: ${restaurantsBackupPath}`);
    console.log('\n📊 RÉSUMÉ DE LA SAUVEGARDE:');
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`👥 Utilisateurs: ${users.length}`);
    console.log(`🏪 Restaurants: ${restaurants.length}`);
    console.log(`📂 Dossier de sauvegarde: ${backupDir}`);
    console.log('\n🎉 Sauvegarde terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
  } finally {
    await client.close();
    console.log('🔌 Connexion fermée');
  }
}
backupCollections();
