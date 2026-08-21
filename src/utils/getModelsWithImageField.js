const mongoose = require('mongoose');
const i18n = require('../config/i18n');
function getModelsWithImageField() {
  const modelsWithImage = [];
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;
    if (schema.paths.image) {
      modelsWithImage.push(model);
    }
  }
  return modelsWithImage;
}
function getModelsWithImageOrDocumentsField() {
  const modelsWithFields = [];
  for (const modelName of Object.keys(mongoose.models)) {
    const model = mongoose.models[modelName];
    const schema = model.schema;
    if (schema.paths.image || schema.paths.documents || schema.paths.logoUrl) {
      modelsWithFields.push(model);
    }
  }
  return modelsWithFields;
}
module.exports = getModelsWithImageOrDocumentsField;
