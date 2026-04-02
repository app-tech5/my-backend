const mongoose = require('mongoose');
const { Schema } = mongoose;

const gatewaySchema = new Schema({
  
  identifier: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  credentials: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  
  fees: {
    percentage: { type: Number, default: 0 }, 
    fixed: { type: Number, default: 0 }      
  },
  
  active: {
    type: Boolean,
    default: false
  },
  
  capabilities: {
    canRefund: { type: Boolean, default: false },   
    canWithdraw: { type: Boolean, default: false }, 
    hasWebhook: { type: Boolean, default: true },   
    isSubscriptionReady: { type: Boolean, default: false } 
  },
  
  webhook: {
    endpoint: String,
    secret: String,
    lastVerification: Date
  },
  
  metadata: {
    iconUrl: String,
    documentationUrl: String,
    apiVersion: String
  }

}, { 
  timestamps: true,
  minimize: false 
});

gatewaySchema.index({ status: 1, type: 1 });

gatewaySchema.methods.supportsCurrency = function(currencyCode) {
  return this.currency.supported.includes(currencyCode.toUpperCase());
};

const Gateway = mongoose.model('Gateway', gatewaySchema);

module.exports = Gateway;