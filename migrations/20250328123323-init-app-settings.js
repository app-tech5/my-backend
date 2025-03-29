module.exports = {
  async up(db) {
    // 1. Créer la collection 'appsettings' (automatique avec insertOne)
    // 2. Insérer le document de configuration par défaut
    await db.collection('appsettings').insertOne({
      appName: "My Uber Eats",
      supportEmail: "contact@myapp.com",
      defaultLanguage: "fr",
      timezone: "Europe/Paris",
      isMaintenance: false,
      commissionRate: 15,
      stripeEnabled: false,
      cashOnDeliveryEnabled: true,
      deliveryFee: 2.5,
      freeDeliveryThreshold: 20,
      maxDeliveryDistance: 15,
      sendOrderEmails: true,
      sendSMSNotifications: false,
      googleMapsApiKey: "",
      twilioSID: "",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 3. Créer un index unique pour empêcher les doublons
    // await db.collection('appsettings').createIndex({ _id: 1 }, { unique: true });
  },

  async down(db) {
    // Rollback : Supprimer la collection entière
    await db.collection('appsettings').drop();
  }
};