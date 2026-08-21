module.exports = {
  up: async (db) => {
    try {
      await db.collection("currencies").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    await db.createCollection('currencies');
    await db.collection('currencies').createIndex({ code: 1 }, { unique: true });

    const basicCurrencies = [
    { code: 'USD', exchangeRate: 1, name: 'United States Dollar', symbol: '$' },
    { code: 'EUR', exchangeRate: 0.85, name: 'Euro', symbol: '€' }];

    await db.collection('currencies').insertMany(basicCurrencies);
  },
  down: async (db) => {
    await db.collection('currencies').drop();
  }
};
