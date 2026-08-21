const mongoose = require('mongoose');
const { Schema } = mongoose;
const SubscriptionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    unique: true,
    trim: true,
    maxlength: 50
  },
  target: {
    type: String,
    required: true,
    enum: ['customer', 'restaurant', 'driver'],
    default: 'customer'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  billing_cycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  benefits: {
    type: [String],
    default: []
  },
  benefitFlags: {
    freeDelivery: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    reducedCommissionPercent: { type: Number, default: 0, min: 0, max: 100 },

    waiveCommission: { type: Boolean, default: false },

    platformAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: Date,
  max_usage: {
    type: Number,
    default: null
  },
  serviceModes: [{
    value: {
      type: String,
      required: true,
      enum: ['delivery', 'pickup', 'dinein'],
      lowercase: true,
      default: ""
    },
    label: {
      type: String,
      required: true,
      trim: true,
      default: ""
    }
  }],
  stripe_id: String,
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});
SubscriptionSchema.pre("find", function () {
  this.populate({
    path: "created_by",
    select: "name"
  });
});
module.exports = mongoose.model('Subscription', SubscriptionSchema);
