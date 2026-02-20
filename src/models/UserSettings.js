const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  
  notifications: {
    newOrders: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    lowStock: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
  },
  
  restaurantSettings: {
    autoAcceptOrders: { type: Boolean, default: false },
    preparationTime: { type: Number, default: 15 },
  },
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
