const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // 👈 ID fixe "app_settings"
    appName: { type: String, required: true },
    defaultCurrency: {
      value: { type: String, required: true },
      label: { type: String, required: true },
      symbol: { type: String, required: true },
    },
    language: { // Ajout du champ langue
        code: { type: String, required: true },
        isDefault: { type: Boolean, required: true, default: false },
        name: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  });

module.exports = mongoose.model('Setting', SettingSchema);
