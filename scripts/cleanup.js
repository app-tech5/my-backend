const mongoose = require('mongoose');
const deleteOrphanedFiles = require('../src/utils/cleanupOrphanedFiles');
require('dotenv').config();

// Connexion à la base de données et exécution du script
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connecté à la base de données');
    await deleteOrphanedFiles(); // Appel de la fonction
    process.exit(0); // Quitter le script après exécution
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données :', err);
    process.exit(1); // Quitter le script en cas d'erreur
  });