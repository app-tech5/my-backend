
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("languages").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const supportedLanguages = [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fr', name: 'French', isDefault: false },
      { code: 'es', name: 'Spanish', isDefault: false },
      { code: 'de', name: 'German', isDefault: false },
      { code: 'ar', name: 'Arabic', isDefault: false },
      { code: 'it', name: 'Italian', isDefault: false },
      { code: 'pt', name: 'Portuguese', isDefault: false },
      { code: 'ru', name: 'Russian', isDefault: false },
      { code: 'zh', name: 'Chinese', isDefault: false },
      { code: 'ja', name: 'Japanese', isDefault: false },
      { code: 'hi', name: 'Hindi', isDefault: false },
      { code: 'nl', name: 'Dutch', isDefault: false },
      { code: 'ko', name: 'Korean', isDefault: false },
      { code: 'tr', name: 'Turkish', isDefault: false }
    ];
    
    await db.collection('languages').insertMany(supportedLanguages);
    
    const defaultLanguage = supportedLanguages.find(lang => lang.isDefault);
    await db.collection('settings').updateOne(
      { _id: "app_settings" },
      { 
        $set: { 
          language: { 
            code: defaultLanguage.code, 
            name: defaultLanguage.name, 
            isDefault: true 
          } 
        } 
      },
      { upsert: true }
    );
  },

  async down(db) {
    
    await db.collection('languages').deleteMany({
      code: { $in: ['en', 'fr', 'es', 'de', 'ar'] }
    });
    
    await db.collection('settings').updateOne(
      { _id: "app_settings" },
      { $unset: { language: "" } }
    );
  }
};

