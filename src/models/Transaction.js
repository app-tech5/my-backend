const mongoose = require('mongoose');
const addPopulateMiddleware = require('../utils/addPopulateMiddleware');
const transactionSchema = new mongoose.Schema({
  transaction_type: {
    type: String,
    enum: [
      'customer_payment',    
      'restaurant_payout',   
      'driver_payout',       
      'platform_commission', 
      'service_fee',         
      'delivery_fee',        
      'tip',                
      'refund',             
      'adjustment',
      'customer_top_up'          
    ],
    required: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    enum: ['USD'],
    required: true,
    select: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled', 'disputed', 'refunded'],
    default: 'pending',
    required: true
  },
  payment_method: {
    type: String,
    enum: [
      'credit_card', 
      'debit_card', 
      'paypal', 
      'apple_pay', 
      'google_pay', 
      'venmo', 
      'ach_transfer', 
      'platform_credit',
      'cash'
    ],
    required: function() {
      return this.transaction_type === 'customer_payment';
    }
  },
  payout_method: {
    type: String,
    enum: [
      'ach_deposit',
      'instant_pay',
      'check',
      'paypal',
      'platform_balance'
    ],
    required: function() {
      return ['restaurant_payout', 'driver_payout'].includes(this.transaction_type);
    }
  },
  date_created: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  date_processed: { 
    type: Date,
    select: false
  },
  date_completed: { 
    type: Date 
  },
  related_order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
    default: new mongoose.Types.ObjectId()
 },
  platform_fee: {
    amount: { type: Number },
    percentage: { type: Number },
    description: { type: String }
  },
  processor_fee: {
    amount: { type: Number },
    description: { type: String }
  },
  tax: {
    amount: { type: Number },
    description: { type: String }
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
addPopulateMiddleware(transactionSchema, [
    { path: "user", select: "name image" },
])

transactionSchema.post('find', function (docs) {
  const filter = this.getFilter();
  const isByUserId = filter.$or?.some((condition) => condition.user || condition.userId);

  if (!isByUserId || !Array.isArray(docs)) return;

  this._walletBalance = docs.reduce((acc, doc) => {
    if (doc.status !== 'completed') return acc;
    const amount = Number(doc.amount) || 0;

    if (
      doc.transaction_type === 'customer_top_up' ||
      doc.transaction_type === 'refund' ||
      doc.transaction_type === 'adjustment'
    ) {
      return acc + amount;
    }

    if (
      doc.transaction_type === 'customer_payment' &&
      doc.payment_method === 'platform_credit'
    ) {
      return acc - amount;
    }

    return acc;
  }, 0);
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
