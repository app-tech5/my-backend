module.exports = {
  up: async (db) => {
    try {
      await db.collection("settings").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    await db.createCollection('settings');
    
    await db.collection('settings').insertOne({
      _id: "app_settings",
      appName: "Food Delivery App",
      currency: {
        value: 'EUR',
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
