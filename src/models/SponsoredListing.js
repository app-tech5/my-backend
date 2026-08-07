const mongoose = require('mongoose');
const { Schema } = mongoose;

const SponsoredListingSchema = new Schema(
  {
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    placement: {
      type: String,
      enum: ['search', 'home_banner', 'both'],
      default: 'search',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_payment', 'active', 'paused', 'ended'],
      default: 'draft',
      index: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    dailyBudget: {
      type: Number,
      min: 0,
      default: null,
    },
    priority: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true, versionKey: false }
);

SponsoredListingSchema.index({ status: 1, placement: 1, startAt: 1, endAt: 1 });

SponsoredListingSchema.pre('find', function () {
  this.populate({ path: 'restaurant', select: 'name image' });
});

SponsoredListingSchema.pre('findOne', function () {
  this.populate({ path: 'restaurant', select: 'name image' });
});

module.exports = mongoose.model('SponsoredListing', SponsoredListingSchema);
