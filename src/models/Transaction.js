const mongoose = require('mongoose');
const addPopulateMiddleware = require('../utils/addPopulateMiddleware');

const transactionSchema = new mongoose.Schema({
  transaction_type: {
    type: String,
    enum: [
      'customer_payment',    // Customer pays for order
      'restaurant_payout',   // Restaurant receives payment
      'driver_payout',       // Driver receives earnings
      'platform_commission', // Platform takes commission
      'service_fee',         // Additional service fees
      'delivery_fee',        // Delivery charges
      'tip',                // Customer tip
      'refund',             // Refund to customer
      'adjustment'          // Manual adjustments
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
    // default: 'USD',
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
//   metadata: {
//     processor_id: { type: String },  // Payment processor transaction ID
//     invoice_id: { type: String },    // For accounting purposes
//     notes: { type: String },         // Any additional notes
//   }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

addPopulateMiddleware(transactionSchema, [
    { path: "user", select: "name image" },
    // { path: "related_order", select: "name" },
])
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;