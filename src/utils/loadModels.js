const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
function loadModels() {
  const modelsDir = path.join(__dirname, '../models'); 
  console.log('Chargement des modèles depuis le dossier models...');
  fs.readdirSync(modelsDir).forEach(file => {
    if (file.endsWith('.js')) { 
      const modelPath = path.join(modelsDir, file);
      console.log(`Chargement du modèle : ${file}`);
      require(modelPath); 
    }
  });
  console.log('Modèles chargés :', Object.keys(mongoose.models));
}
module.exports = loadModels;