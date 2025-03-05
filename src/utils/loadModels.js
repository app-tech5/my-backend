const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Charge tous les modèles Mongoose à partir du dossier `models`.
 */
function loadModels() {
  const modelsDir = path.join(__dirname, '../models'); // Chemin vers le dossier models

  console.log('Chargement des modèles depuis le dossier models...');

  // Lire tous les fichiers dans le dossier models
  fs.readdirSync(modelsDir).forEach(file => {
    if (file.endsWith('.js')) { // Ne charger que les fichiers JavaScript
      const modelPath = path.join(modelsDir, file);
      console.log(`Chargement du modèle : ${file}`);
      require(modelPath); // Charger le modèle
    }
  });

  console.log('Modèles chargés :', Object.keys(mongoose.models));
}

module.exports = loadModels;