const mongoose = require('mongoose');
const Setting = require('./Setting');
const LanguageSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, default: ""},
    name: { type: String, required: true, default: "" },
    isDefault: { type: Boolean, default: false, default: ""},
}, { timestamps: true });
LanguageSchema.post('findOneAndUpdate', async function(doc) {
    if (doc && doc.isDefault) {
        await Setting.findOneAndUpdate(
            {},
            { $set: { language: { code: doc.code, name: doc.name, isDefault: doc.isDefault } } }
        );
    }
});
module.exports = mongoose.model('Language', LanguageSchema);
