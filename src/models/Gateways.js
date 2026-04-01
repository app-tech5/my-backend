const mongoose = require('mongoose');
const { Schema } = mongoose;

const gatewaySchema = new Schema({
  // Identifiant unique (ex: 'stripe-v1', 'orange-money-cm')
  identifier: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  // Nom complet (ex: 'Stripe Payment Gateway')
  name: {
    type: String,
    required: true
  },

  // Type de flux financier
  type: {
    type: String,
    required: true,
    enum: ['card', 'mobile_money', 'bank_transfer', 'crypto', 'wallet'],
    index: true
  },

  // Configuration dynamique (Stocke TOUTES les clés spécifiques sans schéma rigide)
  // Permet d'avoir des clés différentes pour Stripe (pk, sk) et Orange (merchantId, pin)
  credentials: {
    type: Map,
    of: String,
    default: {}
  },

  // Paramètres monétaires
  currency: {
    supported: [{ type: String, uppercase: true }], // ex: ['XAF', 'USD', 'EUR']
    default: { type: String, default: 'XAF' }
  },

  // Gestion des frais (internes à la plateforme)
  fees: {
    percentage: { type: Number, default: 0 }, // ex: 2.5 pour 2.5%
    fixed: { type: Number, default: 0 }      // ex: 100 pour 100 FCFA
  },

  // États opérationnels
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'sandbox'],
    default: 'inactive'
  },

  // Capacités de la passerelle
  capabilities: {
    canRefund: { type: Boolean, default: false },   // Supporte les remboursements
    canWithdraw: { type: Boolean, default: false }, // Supporte les retraits (Payouts)
    hasWebhook: { type: Boolean, default: true },   // Supporte les notifications temps réel
    isSubscriptionReady: { type: Boolean, default: false } // Supporte les paiements récurrents
  },

  // Configuration des Webhooks (pour la sécurité)
  webhook: {
    endpoint: String,
    secret: String,
    lastVerification: Date
  },

  // Métadonnées techniques (pour le frontend ou logs)
  metadata: {
    iconUrl: String,
    documentationUrl: String,
    apiVersion: String
  }

}, { 
  timestamps: true,
  minimize: false // Force l'enregistrement des Maps vides
});

// Indexation pour la performance
gatewaySchema.index({ status: 1, type: 1 });

// Méthode utilitaire pour vérifier si la gateway supporte une devise
gatewaySchema.methods.supportsCurrency = function(currencyCode) {
  return this.currency.supported.includes(currencyCode.toUpperCase());
};

const Gateway = mongoose.model('Gateway', gatewaySchema);

module.exports = Gateway;