module.exports = {
  async up(db, client) {
    // Insérer trois entrées dans la collection Taxe
    await db.collection('taxes').insertMany([
      {
        location: 'New York',
        name: 'Sales Tax',
        rate: 8.875,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        location: 'Los Angeles',
        name: 'Sales Tax',
        rate: 9.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        location: 'Chicago',
        name: 'Sales Tax',
        rate: 10.25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        location: 'Paris',
        name: 'Taxe sur la Valeur Ajoutée (TVA)',
        rate: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        location: 'Tokyo',
        name: 'Consumption Tax',
        rate: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        location: 'Berlin',
        name: 'Mehrwertsteuer (MwSt)',
        rate: 19,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(db, client) {
    // Supprimer les entrées ajoutées lors de la migration
    await db.collection('taxes').deleteMany({
      location: { $in: ['New York', 'Los Angeles', 'Chicago'] }
    });
  }
};