const mongoose = require('mongoose');
const addPopulateMiddleware = require('../utils/addPopulateMiddleware');

const notificationSettingSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['admin', 'restaurant', 'driver', 'customer'],
    required: true,
    index: true,
    default: 'customer'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: false
  },
  channels: {
    type: Object,
    default: {
      email: {
        enabled: true,
        types: {
          newOrder: true,
          promotion: true,
          deliveryUpdate: true
        }
      },
      push: {
        enabled: true,
        types: {
          newOrder: true,
          assignedOrder: true
        }
      },
      sms: {
        enabled: false,
        types: {
          otp: true,
          urgent: false
        }
      }
    }
  },
  preferences: {
    type: Object,
    default: {
      muteAll: false,
      quietHours: {
        start: "22:00",
        end: "08:00"
      }
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

addPopulateMiddleware(notificationSettingSchema, [
{ path: 'userId', select: 'name email role image' }]
);

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);
