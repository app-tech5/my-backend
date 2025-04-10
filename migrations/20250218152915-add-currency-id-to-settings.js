// migrations/XXXXXX-generate-mock-currencies.js

const { faker } = require('@faker-js/faker');

module.exports = {
  async up(db) {
    // Devises courantes à utiliser
    const commonCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1.0 },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.93 },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.79 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 151.63 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', exchangeRate: 1.36 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 1.52 },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', exchangeRate: 7.23 },
      { code: 'XOF', name: 'CFA Franc', symbol: 'CFA', exchangeRate: 600.0 },
    ];

    // Vérifier qu'aucune de ces devises n'existe déjà
    const existingCodes = await db.collection('currencies')
      .find({ code: { $in: commonCurrencies.map(c => c.code) } })
      .project({ code: 1 })
      .toArray();

    const existingCodesSet = new Set(existingCodes.map(c => c.code));
    const currenciesToInsert = commonCurrencies.filter(c => !existingCodesSet.has(c.code));

    if (currenciesToInsert.length > 0) {
      await db.collection('currencies').insertMany(currenciesToInsert);
    }
  },

  async down(db) {
    // Supprimer uniquement les devises que nous avons potentiellement ajoutées
    await db.collection('currencies').deleteMany({
      code: { $in: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'XOF'] }
    });
  }
};

// module.exports = {
//   async up(db) {
//     // Ajouter l'ID '67a3a718a1ae62e91e3df989' au champ 'currency' dans la collection 'settings'
//     await db.collection('settings').updateOne(
//       { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
//       { $set: { 'currency.id': '67a3a718a1ae62e91e3df989' } } // Mise à jour pour ajouter l'ID
//     );
//   },

//   async down(db) {
//     // Retirer l'ID '67a3a718a1ae62e91e3df989' du champ 'currency' dans la collection 'settings'
//     await db.collection('settings').updateOne(
//       { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
//       { $unset: { 'currency.id': '' } } // Mise à jour pour retirer l'ID
//     );
//   }
// };