const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  // Identité
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    unique: true,
    trim: true,
    maxlength: 50
  },

  // Ciblage
  target: {
    type: String,
    required: true,
    enum: ['customer', 'restaurant', 'driver'],
    default: 'customer'
  },

  // Tarification
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
    select: false
  },
  billing_cycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },

  // Avantages
  benefits: {  // Tableau simple de strings
    type: [String],
    default: []
  },

  // Activation
  is_active: {
    type: Boolean,
    default: true
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: Date,  // Optionnel

  // Restrictions
  max_usage: {  // Nombre max d'utilisations (null = illimité)
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

  // Métadonnées
  stripe_id: String,  // ID Stripe pour les paiements récurrents
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