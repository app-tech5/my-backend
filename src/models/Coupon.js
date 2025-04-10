const mongoose = require('mongoose');
const { Schema } = mongoose;

const couponSchema = new Schema({
  // Informations de base
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
  
  // Type de réduction
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_delivery'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: function() {
      return this.discountType !== 'free_delivery';
    },
    min: 0
  },
  
  // Conditions d'application
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
  
  // Validité
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'La date de fin doit être après la date de début'
    }
  },
  
  // Limitations d'utilisation
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
  
  // Public cible
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
  
  // Métadonnées
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

// Index pour les recherches fréquentes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ endDate: 1, isActive: 1 });

// Méthode pour vérifier si le coupon est valide
couponSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.maxUses ? this.currentUses < this.maxUses : true)
  );
};

// Méthode pour appliquer le coupon
couponSchema.methods.applyDiscount = function(totalAmount) {
  if (!this.isValid()) {
    throw new Error('Coupon non valide');
  }
  
  if (this.minOrderAmount && totalAmount < this.minOrderAmount) {
    throw new Error(`Montant minimum de commande non atteint (${this.minOrderAmount})`);
  }
  
  switch (this.discountType) {
    case 'percentage':
      return totalAmount * (1 - this.discountValue / 100);
    case 'fixed':
      return Math.max(0, totalAmount - this.discountValue);
    case 'free_delivery':
      return totalAmount; // La réduction sur les frais de livraison serait appliquée ailleurs
    default:
      return totalAmount;
  }
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;