// migrations/2025MMDDHHMMSS-add-currency-schema.js

module.exports = {
  up: async (db) => {
      try {
        await db.collection("languages").drop();
      } catch (e) {
        if (e.codeName !== "NamespaceNotFound") throw e;
      }
    await db.createCollection('currencies');
    await db.collection('currencies').createIndex({ code: 1 }, { unique: true });

    // Si vous souhaitez ajouter des données initiales, décommentez l'exemple ci-dessous :
    await db.collection('currencies').insertOne({
      code: 'USD',
      exchangeRate: 1,
      name: 'United States Dollar',
      symbol: '$'
    });
  },

  down: async (db) => {
    await db.collection('currencies').drop();
  }
};
