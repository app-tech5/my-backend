#!/usr/bin/env node

/**
 * Script pour tester la connexion à la base de données MongoDB
 * Utilisation : node scripts/test-db-connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Construction flexible de l'URL MongoDB
function buildMongoURL() {
  // Si MONGO_URI est défini, l'utiliser directement
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  // Sinon, construire l'URL à partir des paramètres individuels
  const host = process.env.MONGODB_HOST || '127.0.0.1';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'good-foods';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;

  let url = 'mongodb://';

  // Ajouter authentification si définie
  if (username && password) {
    url += `${username}:${password}@`;
  }

  url += `${host}:${port}/${database}`;

  return url;
}

async function testConnection() {
  console.log('🔍 Test de connexion à MongoDB...\n');

  const mongoURL = buildMongoURL();
  console.log('📍 URL de connexion :', mongoURL.replace(/:[^:]+@/, ':***@')); // Masquer le mot de passe

  try {
    // Connexion avec timeout court pour le test
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 secondes timeout
    });

    console.log('✅ Connexion réussie à MongoDB !');

    // Informations sur la connexion
    const db = mongoose.connection.db;
    const stats = await db.stats();

    console.log(`📊 Base de données : ${db.databaseName}`);
    console.log(`📈 Collections : ${stats.collections}`);
    console.log(`💾 Taille : ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    // Tester une collection
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections disponibles :');
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Vérifier l'utilisateur admin
    if (collections.some(col => col.name === 'users')) {
      const User = mongoose.model('User', new mongoose.Schema({
        email: String,
        role: String,
        isActive: Boolean
      }));

      const adminUser = await User.findOne({ email: 'admin@example.com' });
      if (adminUser) {
        console.log('\n👤 Utilisateur admin trouvé :');
        console.log(`   - Email : ${adminUser.email}`);
        console.log(`   - Rôle : ${adminUser.role}`);
        console.log(`   - Actif : ${adminUser.isActive}`);
      } else {
        console.log('\n⚠️  Aucun utilisateur admin trouvé');
      }
    }

  } catch (error) {
    console.error('❌ Erreur de connexion :', error.message);

    console.log('\n🔧 Conseils de dépannage :');
    console.log('1. Vérifiez que MongoDB est démarré');
    console.log('2. Vérifiez l\'URL de connexion dans votre fichier .env');
    console.log('3. Si vous utilisez un mot de passe, assurez-vous qu\'il est URL-encodé');
    console.log('4. Pour MongoDB Atlas, assurez-vous que l\'IP est autorisée');

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
}

// Exécuter le test
testConnection().catch(console.error);





