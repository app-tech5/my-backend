module.exports = {
  async up(db) {
    
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, 
      { 
        $set: { 
          currency: { 
            label: 'United States Dollar', 
            value: '67a3a718a1ae62e91e3df989' 
          } 
        } 
      } 
    );
  },

  async down(db) {
    
    await db.collection('settings').updateOne(
      { _id: 'app_settings' }, 
      { 
        $set: { 
          currency: { 
            value: 'USD', 
            label: 'United States Dollar', 
            symbol: '$' 
          } 
        } 
      } 
    );
  }
};