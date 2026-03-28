const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema({
    appName: { type: String, required: true },
    currency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Currency',
      required: true
    },
    language: { 
        code: { type: String, required: true },
        isDefault: { type: Boolean, required: true, default: false },
        name: { type: String, required: true },
    },
    image_url: { type: String },
  }, { timestamps: true } );
module.exports = mongoose.model('Setting', SettingSchema);
