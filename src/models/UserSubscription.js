const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true
    },
    target: {
      type: String,
      enum: ['customer', 'restaurant', 'driver'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: true
    },
    cancelledAt: Date,
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'free', 'manual', 'card'],
      default: 'wallet'
    }
  },
  { timestamps: true, versionKey: false }
);

UserSubscriptionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('UserSubscription', UserSubscriptionSchema);
