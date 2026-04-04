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

  image: {
    type: String,
    default: ''
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
    documentationUrl: String,
    apiVersion: String
  }

}, {
  timestamps: true,
  minimize: false
});

gatewaySchema.index({ identifier: 1 });

gatewaySchema.pre(/^find/, function () {
  const role = this.options?.role;

  if (role === 'admin') return;

  this.select(
    '-credentials.secretKey ' +
    '-credentials.clientSecret ' +
    '-credentials.webhookSecret ' +
    '-credentials.encryptionKey ' +
    '-credentials.platformSecret ' +
    '-webhook.secret ' + 
    '-credentials.keySecret'
);
});

const Gateway = mongoose.model('Gateway', gatewaySchema);

module.exports = Gateway;