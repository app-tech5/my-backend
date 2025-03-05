module.exports = {
  async up(db) {
    // Ajouter l'ID '67a3a718a1ae62e91e3df989' au champ 'currency' dans la collection 'settings'
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
      { $set: { 'currency.id': '67a3a718a1ae62e91e3df989' } } // Mise à jour pour ajouter l'ID
    );
  },

  async down(db) {
    // Retirer l'ID '67a3a718a1ae62e91e3df989' du champ 'currency' dans la collection 'settings'
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
      { $unset: { 'currency.id': '' } } // Mise à jour pour retirer l'ID
    );
  }
};