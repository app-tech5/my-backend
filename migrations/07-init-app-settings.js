module.exports = {
  async up(db) {
    try {
      await db.collection("appsettings").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }

    // Clean app settings without sensitive information
    await db.collection('appsettings').insertOne({
      appName: "Food Delivery App",
      supportEmail: "support@yourapp.com", // Generic email
      defaultLanguage: "en",
      timezone: "Europe/Paris",
      isMaintenance: false,
      commissionRate: 15,
      stripeEnabled: false, // Disabled by default for security
      cashOnDeliveryEnabled: true,
      deliveryFee: 2.5,
      freeDeliveryThreshold: 20,
      maxDeliveryDistance: 15,
      sendOrderEmails: true,
      sendSMSNotifications: false,
      // API keys are intentionally left empty for security
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
