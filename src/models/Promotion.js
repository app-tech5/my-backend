const mongoose = require('mongoose');
const { Schema } = mongoose;

const promotionSchema = new Schema({
  // Informations de base
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  image: {
    type: String,
    required: false
  },
  
  // Type de promotion
  promotionType: {
    type: String,
    required: true,
    enum: [
      'percentage_discount', 
      'fixed_discount', 
      'free_delivery', 
      'buy_x_get_y', 
      'combo_deal',
      'flash_sale',
      'happy_hour'
    ],
    default: 'percentage_discount'
  },
  
  // Valeurs de la promotion
  discountValue: {
    type: Number,
    required: function() {
      return ['percentage_discount', 'fixed_discount'].includes(this.promotionType);
    },
    min: 0
  },
  buyQuantity: {
    type: Number,
    required: function() {
      return this.promotionType === 'buy_x_get_y';
    },
    min: 1
  },
  getQuantity: {
    type: Number,
    required: function() {
      return this.promotionType === 'buy_x_get_y';
    },
    min: 1
  },
  comboItems: [{
    item: {
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Portée de la promotion
  scope: {
    type: String,
    required: true,
    enum: ['restaurant', 'category', 'platform', 'item'],
    default: 'restaurant'
  },
  applicableRestaurants: [{
    type: Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  applicableCategories: [{
    type: String,
    enum: ['pizza', 'burger', 'sushi', 'dessert', 'boisson', 'asiatique', 'italien']
  }],
  applicableItems: [{
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
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
  happyHours: [{
    start: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    end: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    days: [{
      type: Number,
      min: 0,
      max: 6
    }]
  }],
  
  // Conditions
  minOrderAmount: {
    type: Number,
    required: false,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    required: false,
    min: 0
  },
  userEligibility: {
    type: String,
    enum: ['all', 'new_users', 'existing_users', 'vip'],
    default: 'all'
  },
  
  // Limitations
  maxUsage: {
    type: Number,
    required: false,
    min: 1
  },
  currentUsage: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Métadonnées
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches fréquentes
promotionSchema.index({ promotionType: 1, isActive: 1 });
promotionSchema.index({ scope: 1, isActive: 1 });
promotionSchema.index({ endDate: 1, isActive: 1 });

// Méthode pour vérifier si la promotion est active
promotionSchema.methods.isActiveNow = function() {
  const now = new Date();
  const isWithinDateRange = now >= this.startDate && now <= this.endDate;
  
  if (this.happyHours && this.happyHours.length > 0) {
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentDay = now.getDay();
    
    const isHappyHour = this.happyHours.some(slot => {
      const [startH, startM] = slot.start.split(':').map(Number);
      const [endH, endM] = slot.end.split(':').map(Number);
      
      const isDayMatch = slot.days.includes(currentDay);
      const isTimeMatch = (
        (currentHour > startH || (currentHour === startH && currentMinutes >= startM)) &&
        (currentHour < endH || (currentHour === endH && currentMinutes <= endM))
      );  // <-- La parenthèse se ferme ici, après toute l'expression
      
      return isDayMatch && isTimeMatch;
    });
    
    return this.isActive && isWithinDateRange && isHappyHour;
  }
  
  return this.isActive && isWithinDateRange;
};

// Méthode pour appliquer la promotion
promotionSchema.methods.applyPromotion = function(item, quantity = 1, totalAmount = 0) {
  if (!this.isActiveNow()) {
    throw new Error('Promotion non active');
  }
  
  switch (this.promotionType) {
    case 'percentage_discount':
      const discount = item.price * (this.discountValue / 100);
      return Math.min(discount, this.maxDiscountAmount || Infinity);
      
    case 'fixed_discount':
      return this.discountValue;
      
    case 'buy_x_get_y':
      const freeItems = Math.floor(quantity / this.buyQuantity) * this.getQuantity;
      return freeItems * item.price;
      
    case 'combo_deal':
      const comboItem = this.comboItems.find(ci => ci.item.equals(item._id));
      return comboItem ? (item.price - comboItem.discountedPrice) : 0;
      
    case 'free_delivery':
      return 0; // Les frais de livraison seront gérés séparément
      
    default:
      return 0;
  }
};

// Middleware pour valider la cohérence des données
promotionSchema.pre('save', function(next) {
  if (this.promotionType === 'combo_deal' && this.comboItems.length < 2) {
    throw new Error('Un combo deal doit inclure au moins 2 items');
  }
  
  if (this.scope === 'restaurant' && this.applicableRestaurants.length === 0) {
    throw new Error('Au moins un restaurant doit être spécifié pour ce type de promotion');
  }
  
  if (this.scope === 'category' && this.applicableCategories.length === 0) {
    throw new Error('Au moins une catégorie doit être spécifiée pour ce type de promotion');
  }
  
  if (this.scope === 'item' && this.applicableItems.length === 0) {
    throw new Error('Au moins un item doit être spécifié pour ce type de promotion');
  }
  
  next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;