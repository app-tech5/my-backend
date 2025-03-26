const mongoose = require('mongoose');
const Setting = require('./Setting');

const LanguageSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

LanguageSchema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.isDefault) {
        await Setting.findByIdAndUpdate(
            "app_settings", 
            { $set: { language: { code: doc.code, name: doc.name, isDefault: doc.isDefault } } }
        );
    }
});


module.exports = mongoose.model('Language', LanguageSchema);
