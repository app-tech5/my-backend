const mongoose = require('mongoose');

const AppSettingSchema = new mongoose.Schema(
  {
    // Général
    appName: { type: String, default: "My Uber Eats" },
    supportEmail: { type: String, default: "contact@myapp.com" },
    defaultLanguage: { type: String, default: "fr" },
    timezone: { type: String, default: "Europe/Paris" },
    isMaintenance: { type: Boolean, default: false },

    // Paiements & Commissions
    commissionRate: { type: Number, default: 15, min: 0, max: 100 }, // %
    stripeEnabled: { type: Boolean, default: false },
    cashOnDeliveryEnabled: { type: Boolean, default: true },

    // Livraison
    deliveryFee: { type: Number, default: 2.5 }, // €
    freeDeliveryThreshold: { type: Number, default: 20 }, // €
    maxDeliveryDistance: { type: Number, default: 15 }, // km

    // Notifications
    sendOrderEmails: { type: Boolean, default: true },
    sendSMSNotifications: { type: Boolean, default: false },

    // Intégrations
    googleMapsApiKey: { type: String, default: "" },
    twilioSID: { type: String, default: "" }, // Pour les SMS
  },
  { 
    timestamps: true, // Ajoute createdAt et updatedAt
    minimize: false // Garantit que les objets vides sont sauvegardés
  }
);

// Export du modèle
module.exports = mongoose.model('AppSetting', AppSettingSchema);