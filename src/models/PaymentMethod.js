const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentMethodSchema = new Schema({
  // Référence utilisateur
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Type de méthode de paiement
  methodType: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'cash_on_delivery'],
    default: 'credit_card'
  },

  // Informations communes
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Détails pour les cartes
  cardDetails: {
    cardNumberLast4: {
      type: String,
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      maxlength: 4
    },
    cardBrand: {
      type: String,
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      enum: ['visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners', 'unionpay', 'other']
    },
    expiryMonth: {
      type: Number,
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      min: 1,
      max: 12
    },
    expiryYear: {
      type: Number,
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      min: new Date().getFullYear(),
      max: new Date().getFullYear() + 20
    },
    cardholderName: {
      type: String,
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      maxlength: 100
    },
    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },

  // Détails pour PayPal
  paypalEmail: {
    type: String,
    required: function() { return this.methodType === 'paypal'; },
    match: [/.+\@.+\..+/, 'Veuillez entrer un email valide']
  },

  // Détails pour Apple Pay/Google Pay
  walletToken: {
    type: String,
    required: function() { 
      return ['apple_pay', 'google_pay'].includes(this.methodType); 
    }
  },

  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  },

  // Sécurité
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'failed'],
    default: 'unverified'
  },
  verificationDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Masquer les détails sensibles dans les réponses JSON
      delete ret.cardDetails;
      delete ret.paypalEmail;
      delete ret.walletToken;
      return ret;
    }
  }
});

// Index pour les recherches fréquentes
paymentMethodSchema.index({ user: 1, isActive: 1 });
paymentMethodSchema.index({ user: 1, isDefault: 1 });

// paymentMethodSchema.pre("findOne", function () {
//     this.populate(
//       {
//         path: "user",
//         select: "name", // On ne récupère que le nom du restaurant
//       })
//   });

// Ajouter ce hook séparé pour les requêtes find
paymentMethodSchema.pre(/^find/, function(next) {
    this.populate({
      path: 'user',
      select: 'name'
    });
    next();
  });

// Middleware pour s'assurer qu'il n'y a qu'une seule méthode par défaut
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault) {
    try {
      await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Méthode pour formater le masquage des informations de paiement
paymentMethodSchema.methods.getMaskedDetails = function() {
  switch (this.methodType) {
    case 'credit_card':
    case 'debit_card':
      return {
        type: this.methodType,
        brand: this.cardDetails.cardBrand,
        last4: this.cardDetails.cardNumberLast4,
        expiry: `${this.cardDetails.expiryMonth}/${this.cardDetails.expiryYear}`
      };
    case 'paypal':
      return {
        type: this.methodType,
        email: this.paypalEmail.replace(/(.{1,3})(.*)(@.*)/, (m, a, b, c) => a + b.replace(/./g, '*') + c)
      };
    case 'apple_pay':
    case 'google_pay':
      return {
        type: this.methodType,
        wallet: '••••••••••••' + this.walletToken.slice(-4)
      };
    case 'cash_on_delivery':
      return { type: this.methodType };
    default:
      return { type: 'other' };
  }
};

// Méthode pour vérifier si la méthode est expirée (pour les cartes)
paymentMethodSchema.methods.isExpired = function() {
  if (['credit_card', 'debit_card'].includes(this.methodType)) {
    const now = new Date();
    const expiryDate = new Date(
      this.cardDetails.expiryYear,
      this.cardDetails.expiryMonth - 1,
      1
    );
    return now > expiryDate;
  }
  return false;
};

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;