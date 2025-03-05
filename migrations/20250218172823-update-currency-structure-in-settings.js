module.exports = {
  async up(db) {
    // Mettre à jour le champ 'currency' dans la collection 'settings'
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
      { 
        $set: { 
          currency: { 
            label: 'United States Dollar', 
            value: '67a3a718a1ae62e91e3df989' 
          } 
        } 
      } // Mise à jour pour définir la nouvelle structure de 'currency'
    );
  },

  async down(db) {
    // Revenir à la structure précédente de 'currency' (optionnel)
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, // Filtre pour trouver le document spécifique
      { 
        $set: { 
          currency: { 
            value: 'USD', 
            label: 'United States Dollar', 
            symbol: '$' 
          } 
        } 
      } // Mise à jour pour rétablir l'ancienne structure de 'currency'
    );
  }
};