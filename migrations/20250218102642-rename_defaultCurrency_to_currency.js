module.exports = {
  up: async (db) => {
    const settingsCollection = db.collection('settings');
    await settingsCollection.updateOne(
      { _id: "app_settings" },
      { $rename: { "defaultCurrency": "currency" } }
    );
  },
  down: async (db) => {
    const settingsCollection = db.collection('settings');
    await settingsCollection.updateOne(
      { _id: "app_settings" },
      { $rename: { "currency": "defaultCurrency" } }
    );
  }
};
