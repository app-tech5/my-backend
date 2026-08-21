const mongoose = require('mongoose');
const { Schema } = mongoose;
const i18n = require('../config/i18n');
const couponSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 5,
    maxlength: 20
  },
  description: {
    type: String,
    required: false,
    maxlength: 200
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_delivery'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: function () {
      return this.discountType !== 'free_delivery';
    },
    min: 0
  },
  minOrderAmount: {
    type: Number,
    required: false,
    min: 0
  },
  applicableRestaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  applicableCategories: [{
    type: String,
    enum: ['pizza', 'burger', 'sushi', 'dessert', 'boisson', 'asiatique', 'italien']
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.startDate;
      },
      message: i18n.__('end_date_must_be_after_start_date')
    }
  },
  maxUses: {
    type: Number,
    required: false,
    min: 1
  },
  currentUses: {
    type: Number,
    default: 0,
    min: 0
  },
  userUsageLimit: {
    type: Number,
    required: false,
    min: 1,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  targetedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  firstOrderOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ endDate: 1, isActive: 1 });
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate && (
    this.maxUses ? this.currentUses < this.maxUses : true));

};
couponSchema.methods.applyDiscount = function (totalAmount) {
  if (!this.isValid()) {
    throw new Error(i18n.__('invalid_coupon'));
  }
  if (this.minOrderAmount && totalAmount < this.minOrderAmount) {
    throw new Error(i18n.__('minimum_order_amount_not_reached', this.minOrderAmount));
  }
  switch (this.discountType) {
    case 'percentage':
      return totalAmount * (1 - this.discountValue / 100);
    case 'fixed':
      return Math.max(0, totalAmount - this.discountValue);
    case 'free_delivery':
      return totalAmount;
    default:
      return totalAmount;
  }
};
const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
