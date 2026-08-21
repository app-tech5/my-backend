const bcrypt = require('bcryptjs');

module.exports = {
  async up(db) {
    try {
      // Vérifier si l'utilisateur demo existe déjà
      const existingUser = await db.collection('users').findOne({ email: 'demo@customer.com' });
      if (existingUser) {
        console.log('Demo user already exists, skipping creation');
        return;
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('demo123', 10);

      // Créer l'utilisateur demo
      await db.collection('users').insertOne({
        email: 'demo@customer.com',
        password: hashedPassword,
        name: 'Demo Customer',
        phone: '',
        address: '',
        location: {
          latitude: null,
          longitude: null
        },
        role: 'customer',
        favorites: [],
        orders: [],
        deliveryZones: [],
        isActive: true,
        paymentMethods: [],
        ratings: {
          asCustomer: null,
          asRestaurant: null,
          asDelivery: null
        },
        deviceToken: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Demo user created successfully');
    } catch (error) {
      console.error('Error creating demo user:', error);
      throw error;
    }
  },

  async down(db) {
    // Supprimer l'utilisateur demo lors du rollback
    await db.collection('users').deleteOne({ email: 'demo@customer.com' });
    console.log('Demo user removed');
  }
};
