const mongoose = require('mongoose');
const AppSettingSchema = new mongoose.Schema(
  {
    appName: { type: String, default: "My Uber Eats" },
    supportEmail: { type: String, default: "contact@myapp.com" },
    defaultLanguage: { type: String, default: "fr" },
    timezone: { type: String, default: "Europe/Paris" },
    isMaintenance: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 15, min: 0, max: 100 }, 
    stripeEnabled: { type: Boolean, default: true },
    cashOnDeliveryEnabled: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 2.5 }, 
    freeDeliveryThreshold: { type: Number, default: 20 }, 
    maxDeliveryDistance: { type: Number, default: 15 }, 
    sendOrderEmails: { type: Boolean, default: true },
    sendSMSNotifications: { type: Boolean, default: false },
    googleMapsApiKey: { type: String, default: "" },
    twilioSID: { type: String, default: "" },
    // Wallet monetization
    walletCashbackEnabled: { type: Boolean, default: true },
    walletCashbackPercent: { type: Number, default: 2, min: 0, max: 100 },
    walletInstantRefundEnabled: { type: Boolean, default: true },
    // Emerging-market channels (WhatsApp Cloud API / USSD / web intake)
    whatsappEnabled: { type: Boolean, default: false },
    whatsappPhoneNumberId: { type: String, default: "" },
    whatsappAccessToken: { type: String, default: "" },
    whatsappVerifyToken: { type: String, default: "" },
    whatsappTemplateLang: { type: String, default: "en" },
    whatsappNotifyOnStatus: { type: Boolean, default: true },
    ussdEnabled: { type: Boolean, default: false },
    ussdShortCode: { type: String, default: "" },
    ussdApiKey: { type: String, default: "" },
    webOrderingEnabled: { type: Boolean, default: true },
  },
  { 
    timestamps: true, 
    minimize: false 
  }
);
module.exports = mongoose.model('AppSetting', AppSettingSchema);