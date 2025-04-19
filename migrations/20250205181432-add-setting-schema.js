// migrations/2025MMDDHHMMSS-add-setting-schema.js

module.exports = {
  up: async (db) => {
    try {
      await db.collection("settings").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    await db.createCollection('settings');

    // Ajout d'un enregistrement par défaut avec un _id fixe "app_settings"
    await db.collection('settings').insertOne({
      _id: "app_settings",
      appName: "My Application",
      // defaultCurrency: {
      //   value: "USD",
      //   label: "United States Dollar",
      //   symbol: "$"
      // },
      currency: { 
        value: '67a64237b782d2379aab2ae7', 
        label: 'Euro',
        symbol: "€",
        code: "EUR"
      },
      language: {
        code: "en",
        isDefault: true,
        name: "English"
      },
      createdAt: new Date()
    });
  },

  down: async (db) => {
    await db.collection('settings').drop();
  }
};
