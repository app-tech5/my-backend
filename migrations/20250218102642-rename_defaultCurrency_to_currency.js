module.exports = {
  up: async (db) => {
    const settingsCollection = db.collection('settings');

    // Met à jour le champ defaultCurrency en currency
    await settingsCollection.updateOne(
      { _id: "app_settings" },
      { $rename: { "defaultCurrency": "currency" } }
    );
  },

  down: async (db) => {
    const settingsCollection = db.collection('settings');

    // Revert le changement en renommant currency en defaultCurrency
    await settingsCollection.updateOne(
      { _id: "app_settings" },
      { $rename: { "currency": "defaultCurrency" } }
    );
  }
};
