// migrations/2025MMDDHHMMSS-add-language-schema.js

module.exports = {
  up: async (db) => {
    await db.createCollection('languages');
    await db.collection('languages').createIndex({ code: 1 }, { unique: true });

    // Si vous souhaitez ajouter des langues par défaut, décommentez cet exemple :
    await db.collection('languages').insertMany([
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fr', name: 'Français', isDefault: false }
    ]);
  },

  down: async (db) => {
    await db.collection('languages').drop();
  }
};
