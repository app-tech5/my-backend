const mongoose = require('mongoose');
const { Schema } = mongoose;
const deliverySettingsSchema = new Schema({
  isDeliveryEnabled: {
    type: Boolean,
    default: true,
    required: true
  },
  deliveryPreparationTime: { 
    type: Number,
    default: 30,
    min: 5,
    max: 180
  },
  maxDeliveryDistance: { 
    type: Number,
    default: 15,
    min: 1,
    max: 50
  },
  deliveryFeeType: {
    type: String,
    enum: ['FIXED', 'DYNAMIC', 'FREE', 'RESTAURANT_DEFINED'],
    default: 'FIXED'
  },
  fixedDeliveryFee: {
    type: Number,
    default: 2.5,
    min: 0
  },
  dynamicDeliveryFee: {
    type: Object,
    default: {
      baseFee: 1.5,
      perKmFee: 0.5,
      minFee: 1.5,
      maxFee: 10
    }
  },
  freeDeliveryThreshold: { 
    type: Number,
    default: 25
  },
  deliveryZones: [{
    name: String,
    polygonCoordinates: [[Number]], 
    fee: Number
  }],
  deliveryHours: {
    type: Object,
    default: {
      start : '08:00',
      end: '23:00'
    }
  },
  blackoutDays: [Date], 
  allowScheduledDelivery: {
    type: Boolean,
    default: true
  },
  schedulingLeadTime: { 
    type: Number,
    default: 2
  },
  timeSlotDuration: { 
    type: Number,
    default: 30,
    enum: [15, 30, 45, 60]
  },
  driverAssignmentMethod: {
    type: String,
    enum: ['AUTO', 'MANUAL', 'HYBRID'],
    default: 'AUTO'
  },
  autoAssignmentRadius: { 
    type: Number,
    default: 5
  },
  realTimeTracking: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });
const DeliverySettings = mongoose.model('DeliverySetting', deliverySettingsSchema);
module.exports = DeliverySettings;