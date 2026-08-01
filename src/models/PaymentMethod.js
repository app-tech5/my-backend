const mongoose = require('mongoose');
const { Schema } = mongoose;
const i18n = require('../config/i18n');

function maskPaypalEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.replace(/(.{1,3})(.*)(@.*)/, (_match, start, middle, domain) =>
    `${start}${middle.replace(/./g, '*')}${domain}`
  );
}

const paymentMethodSchema = new Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  methodType: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'cash_on_delivery', 'platform_credit'],
    default: 'credit_card'
  },
  purpose: {
    type: String,
    enum: ['payment', 'payout'],
    default: 'payment',
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
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
      // require c'est pour 
      required: function() { 
        return ['credit_card', 'debit_card'].includes(this.methodType); 
      },
      enum: ['visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners', 'unionpay', 'other']
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
  bankDetails: {
    accountHolderName: {
      type: String,
      required: function () {
        return this.methodType === 'bank_transfer' && !this.stripeConnectAccountId;
      },
      maxlength: 100,
    },
    iban: {
      type: String,
      required: function () {
        return this.methodType === 'bank_transfer' && !this.stripeConnectAccountId;
      },
    },
    ibanLast4: {
      type: String,
      maxlength: 4,
    },
    bankName: {
      type: String,
      maxlength: 100,
    },
  },
  paypalEmail: {
    type: String,
    required: function() { return this.methodType === 'paypal'; },
    match: [/.+\@.+\..+/, i18n.__('please_enter_valid_email')]
  },
  walletToken: {
    type: String,
    // required: function() { 
    //   return ['apple_pay', 'google_pay'].includes(this.methodType); 
    // }
  },
  stripeConnectAccountId: {
    type: String,
    default: '',
  },
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
      if (ret.bankDetails?.iban) {
        delete ret.bankDetails.iban;
      }
      if (ret.paypalEmail) {
        ret.paypalEmailMasked = maskPaypalEmail(ret.paypalEmail);
        delete ret.paypalEmail;
      }
      delete ret.walletToken;
      return ret;
    }
  }
});
paymentMethodSchema.index({ user: 1, isActive: 1 });
paymentMethodSchema.index({ user: 1, purpose: 1, isActive: 1 });
paymentMethodSchema.index({ user: 1, isDefault: 1 });
paymentMethodSchema.pre(/^find/, function(next) {
    this.populate({
      path: 'user',
      select: 'name'
    });
    next();
  });
const isDefaultTruthyUpdate = (update = {}) =>
  update.isDefault === true || update.$set?.isDefault === true;

paymentMethodSchema.pre('save', async function(next) {
  try {
    if (this.methodType === 'bank_transfer' && this.bankDetails?.iban) {
      const normalized = String(this.bankDetails.iban).replace(/\s/g, '').toUpperCase();
      this.bankDetails.iban = normalized;
      this.bankDetails.ibanLast4 = normalized.slice(-4);
    }

    const purpose = this.purpose || 'payment';

    if (this.isNew) {
      const hasDefault = await this.constructor.exists({
        user: this.user,
        purpose,
        isDefault: true,
        isActive: true,
      });
      if (!hasDefault) {
        this.isDefault = true;
      }
    }

    if (this.isDefault) {
      await this.constructor.updateMany(
        { user: this.user, purpose, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    }
  } catch (err) {
    return next(err);
  }
  next();
});

paymentMethodSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();

  if (process.env.DEMO_MODE === 'true' && isDefaultTruthyUpdate(update)) {
    const err = new Error(i18n.__('demo_mode_action_not_available'));
    err.statusCode = 403;
    return next(err);
  }

  if (isDefaultTruthyUpdate(update)) {
    try {
      const doc = await this.model.findOne(this.getQuery());
      if (doc?.user) {
        await this.model.updateMany(
          {
            user: doc.user,
            purpose: doc.purpose || 'payment',
            _id: { $ne: doc._id },
          },
          { $set: { isDefault: false } }
        );
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
});
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
    case 'bank_transfer':
      return {
        type: this.methodType,
        purpose: this.purpose,
        provider: this.stripeConnectAccountId ? 'stripe' : 'manual',
        accountHolderName: this.bankDetails?.accountHolderName,
        ibanLast4: this.bankDetails?.ibanLast4,
        bankName: this.bankDetails?.bankName,
        stripeConnectAccountId: this.stripeConnectAccountId || undefined,
      };
    default:
      return { type: 'other' };
  }
};
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