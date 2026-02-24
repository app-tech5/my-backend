module.exports = {
  async up(db) {
    try {
      await db.collection("appsettings").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    await db.collection('appsettings').insertOne({
      appName: "Food Delivery App",
      supportEmail: "support@yourapp.com", 
      defaultLanguage: "en",
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
