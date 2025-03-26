const mongoose = require('mongoose');

/**
 * Récupère tous les modèles Mongoose qui ont un champ `image`.
 * @returns {mongoose.Model[]} - Liste des modèles avec un champ `image`.
 */
function getModelsWithImageField() {
  const modelsWithImage = [];

  console.log('Début de la détection des modèles avec un champ `image`...');
  // console.log('Modèles disponibles dans Mongoose :', Object.keys(mongoose.models));

  // Parcourir tous les modèles enregistrés dans Mongoose
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;

    console.log(`Vérification du modèle : ${modelName}`);
    console.log('Chemins du schéma :', Object.keys(schema.paths));

    // Vérifier si le schéma contient un champ `image`
    if (schema.paths.image) {
      console.log(`Champ \`image\` trouvé dans le modèle ${modelName}.`);
      modelsWithImage.push(model);
    } else {
      console.log(`Aucun champ \`image\` trouvé dans le modèle ${modelName}.`);
    }
  }

  console.log('Modèles avec un champ `image` détectés :', modelsWithImage.map(m => m.modelName));
  return modelsWithImage;
}

function getModelsWithImageOrDocumentsField() {
  const modelsWithFields = [];

  console.log('Début de la détection des modèles avec un champ `image` ou `documents`...');

  // Parcourir tous les modèles enregistrés dans Mongoose
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;

    console.log(`Vérification du modèle : ${modelName}`);
    console.log('Chemins du schéma :', Object.keys(schema.paths));

    // Vérifier si le schéma contient un champ `image` ou `documents`
    if (schema.paths.image || schema.paths.documents) {
      console.log(`Champ \`image\` ou \`documents\` trouvé dans le modèle ${modelName}.`);
      modelsWithFields.push(model);
    } else {
      console.log(`Aucun champ \`image\` ou \`documents\` trouvé dans le modèle ${modelName}.`);
    }
  }

  console.log('Modèles détectés :', modelsWithFields.map(m => m.modelName));
  return modelsWithFields;
}


module.exports = getModelsWithImageOrDocumentsField;