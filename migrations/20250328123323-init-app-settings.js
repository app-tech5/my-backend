module.exports = {
  async up(db) {
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
  },
  async down(db) {
    await db.collection('appsettings').drop();
  }
};