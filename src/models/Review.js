const mongoose = require('mongoose');
const { Schema } = mongoose;
const reviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: false 
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} doit être un entier entre 1 et 5'
    }
  },
  comment: {
    type: String,
    required: false,
    maxlength: 1000,
    trim: true
  },
  photos: [{
    type: String, 
    validate: {
      validator: function(array) {
        return array.length <= 5; 
      },
      message: 'Maximum 5 photos par avis'
    }
  }],
  foodQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  deliveryTime: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  packaging: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  deliveryService: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  reply: {
    text: {
      type: String,
      maxlength: 1000
    },
    date: {
      type: Date
    },
    by: {
      type: Schema.Types.ObjectId,
      ref: 'User' 
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved'
  },
  flaggedReason: {
    type: String,
    required: function() {
      return this.status === 'flagged';
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
reviewSchema.pre("find", function () {
    this.populate([
      {
        path: "user",
        select: "name", 
      },
      {
        path: "restaurant",
        select: "name", 
      },
    ]);
  });
reviewSchema.index({ restaurant: 1, status: 1 });
reviewSchema.index({ user: 1, restaurant: 1 }, { unique: true }); 
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Order = mongoose.model('Order');
    const hasOrdered = await Order.exists({
      user: this.user,
      restaurant: this.restaurant,
      status: 'delivered'
    });
    if (!hasOrdered) {
      throw new Error('Vous devez avoir commandé dans ce restaurant pour laisser un avis');
    }
  }
  next();
});
reviewSchema.statics.calculateAverageRating = async function(restaurantId) {
  const result = await this.aggregate([
    {
      $match: { 
        restaurant: restaurantId,
        status: 'approved' 
      }
    },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
        foodQualityAvg: { $avg: '$foodQuality' },
        deliveryTimeAvg: { $avg: '$deliveryTime' },
        packagingAvg: { $avg: '$packaging' },
        deliveryServiceAvg: { $avg: '$deliveryService' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  try {
    const Restaurant = mongoose.model('Restaurant');
    await Restaurant.findByIdAndUpdate(restaurantId, {
      averageRating: result[0]?.averageRating || 0,
      foodQualityRating: result[0]?.foodQualityAvg || 0,
      deliveryTimeRating: result[0]?.deliveryTimeAvg || 0,
      packagingRating: result[0]?.packagingAvg || 0,
      deliveryServiceRating: result[0]?.deliveryServiceAvg || 0,
      reviewCount: result[0]?.reviewCount || 0
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour des notes moyennes:', err);
  }
};
reviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.restaurant);
});
reviewSchema.post('remove', function() {
  this.constructor.calculateAverageRating(this.restaurant);
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;