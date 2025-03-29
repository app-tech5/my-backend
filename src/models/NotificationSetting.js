// models/NotificationSetting.js
const mongoose = require('mongoose');

const notificationSettingSchema = new mongoose.Schema({
  userType: { 
    type: String, 
    enum: ['admin', 'restaurant', 'driver', 'customer'], 
    required: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'userType',
    index: true 
  },
  channels: {
    email: { 
      enabled: { type: Boolean, default: true },
      types: {
        newOrder: { type: Boolean, default: true },
        promotion: { type: Boolean, default: true },
        deliveryUpdate: { type: Boolean, default: true }
      }
    },
    push: { 
      enabled: { type: Boolean, default: true },
      types: {
        newOrder: { type: Boolean, default: true },
        assignedOrder: { type: Boolean, default: true }
      }
    },
    sms: { 
      enabled: { type: Boolean, default: false },
      types: {
        otp: { type: Boolean, default: true },
        urgent: { type: Boolean, default: false }
      }
    }
  },
  preferences: {
    muteAll: { type: Boolean, default: false },
    quietHours: {
      start: { type: String, default: "22:00" },
      end: { type: String, default: "08:00" }
    }
  },
  lastUpdated: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);