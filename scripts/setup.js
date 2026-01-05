#!/usr/bin/env node

/**
 * Script de configuration initiale du projet
 * Utilisation : node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  console.log('🚀 Configuration du projet Good Foods Backend\n');

  // Vérifier si .env existe déjà
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await askQuestion('.env existe déjà. Voulez-vous le remplacer ? (y/N) : ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Configuration annulée.');
      rl.close();
      return;
    }
  }

  console.log('📝 Configuration de la base de données MongoDB\n');

  // Type de configuration
  console.log('Choisissez le type de configuration :');
  console.log('1. URL complète (recommandé pour MongoDB Atlas)');
  console.log('2. Paramètres séparés (recommandé pour le développement local)');

  const configType = await askQuestion('Votre choix (1 ou 2) : ');

  let envContent = '# Configuration générée automatiquement\n\n';

  if (configType === '1') {
    // Configuration avec URL complète
    const mongoUri = await askQuestion('URL MongoDB (mongodb://127.0.0.1:27017/good-foods) : ');
    envContent += `MONGO_URI=${mongoUri || 'mongodb://127.0.0.1:27017/good-foods'}\n`;

  } else {
    // Configuration avec paramètres séparés
    const host = await askQuestion('Host MongoDB (127.0.0.1) : ');
    const port = await askQuestion('Port MongoDB (27017) : ');
    const database = await askQuestion('Nom de la base de données (good-foods) : ');
    const username = await askQuestion('Utilisateur MongoDB (laisser vide si pas d\'authentification) : ');
    const password = await askQuestion('Mot de passe MongoDB (laisser vide si pas d\'authentification) : ');

    const finalHost = host || '127.0.0.1';
    const finalPort = port || '27017';
    const finalDatabase = database || 'good-foods';

    // Construire l'URL MongoDB complète (toujours localhost pour développement)
    let mongoUri = 'mongodb://';
    if (username && password) {
      mongoUri += `${username}:${password}@`;
    }
    mongoUri += `localhost:27017/${finalDatabase}`;

    envContent += `# Configuration MongoDB\n`;
    envContent += `MONGO_URI=${mongoUri}\n`;  // URI complète pour la compatibilité
    envContent += `MONGODB_HOST=${finalHost}\n`;
    envContent += `MONGODB_PORT=${finalPort}\n`;
    envContent += `MONGODB_DATABASE=${finalDatabase}\n`;

    if (username) envContent += `MONGODB_USERNAME=${username}\n`;
    if (password) envContent += `MONGODB_PASSWORD=${password}\n`;
  }

  // Configuration du serveur
  console.log('\n⚙️ Configuration du serveur\n');

  const port = await askQuestion('Port du serveur (5000) : ');
  const jwtSecret = await askQuestion('Clé secrète JWT (laissez vide pour générer automatiquement) : ');

  envContent += `\n# Configuration du serveur\n`;
  envContent += `PORT=${port || '5000'}\n`;
  envContent += `JWT_SECRET=${jwtSecret || generateJWTSecret()}\n`;
  envContent += `NODE_ENV=development\n`;

  // Écrire le fichier .env
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration terminée !');
  console.log(`📄 Fichier .env créé : ${envPath}`);
  console.log('\n📋 Prochaines étapes :');
  console.log('1. npm run test:db    # Tester la connexion');
  console.log('2. npm run migrate:up # Exécuter les migrations');
  console.log('3. npm start          # Démarrer le serveur');

  rl.close();
}

function generateJWTSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Exécuter le setup
setup().catch(console.error);