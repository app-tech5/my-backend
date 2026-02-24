const mongoose = require('mongoose');
const i18n = require('../config/i18n');
function getModelsWithImageField() {
  const modelsWithImage = [];
  console.log(i18n.__('models_with_image_field_detection_start'));
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;
    console.log(`Vérification du modèle : ${modelName}`);
    console.log(i18n.__('schema_paths'), Object.keys(schema.paths));
    if (schema.paths.image) {
      console.log(`Champ \`image\` trouvé dans le modèle ${modelName}.`);
      modelsWithImage.push(model);
    } else {
      console.log(`Aucun champ \`image\` trouvé dans le modèle ${modelName}.`);
    }
  }
  console.log(i18n.__('models_with_image_field_detected'), modelsWithImage.map(m => m.modelName));
  return modelsWithImage;
}
function getModelsWithImageOrDocumentsField() {
  const modelsWithFields = [];
  console.log(i18n.__('models_with_image_documents_detection_start'));
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;
    console.log(`Vérification du modèle : ${modelName}`);
    console.log(i18n.__('schema_paths'), Object.keys(schema.paths));
    if (schema.paths.image || schema.paths.documents) {
      console.log(`Champ \`image\` ou \`documents\` trouvé dans le modèle ${modelName}.`);
      modelsWithFields.push(model);
    } else {
      console.log(`Aucun champ \`image\` ou \`documents\` trouvé dans le modèle ${modelName}.`);
    }
  }
  console.log(i18n.__('models_detected'), modelsWithFields.map(m => m.modelName));
  return modelsWithFields;
}
module.exports = getModelsWithImageOrDocumentsField;