const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const i18n = require('../config/i18n');
function loadModels() {
  const modelsDir = path.join(__dirname, '../models');
  fs.readdirSync(modelsDir).forEach((file) => {
    if (file.endsWith('.js')) {
      const modelPath = path.join(modelsDir, file);
      require(modelPath);
    }
  });
}
module.exports = loadModels;
