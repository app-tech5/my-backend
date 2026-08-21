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
      code: { $in: ['en', 'fr'] }
    });
    await db.collection('settings').updateOne(
      { _id: "app_settings" },
      { $unset: { language: "" } }
    );
  }
};
