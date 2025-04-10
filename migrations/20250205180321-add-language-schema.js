// migrations/XXXXXX-generate-mock-languages.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("languages").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    // Langues supportées communes
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


    // Insérer les langues de base
    await db.collection('languages').insertMany(supportedLanguages);

    // Mettre à jour les settings avec la langue par défaut
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
    // Supprimer uniquement les langues que nous avons créées
    await db.collection('languages').deleteMany({
      code: { $in: ['en', 'fr', 'es', 'de', 'ar'] }
    });

    // Réinitialiser la langue dans les settings
    await db.collection('settings').updateOne(
      { _id: "app_settings" },
      { $unset: { language: "" } }
    );
  }
};

// // migrations/2025MMDDHHMMSS-add-language-schema.js

// module.exports = {
//   up: async (db) => {
//     await db.createCollection('languages');
//     await db.collection('languages').createIndex({ code: 1 }, { unique: true });

//     // Si vous souhaitez ajouter des langues par défaut, décommentez cet exemple :
//     await db.collection('languages').insertMany([
//       { code: 'en', name: 'English', isDefault: true },
//       { code: 'fr', name: 'Français', isDefault: false }
//     ]);
//   },

//   down: async (db) => {
//     await db.collection('languages').drop();
//   }
// };
