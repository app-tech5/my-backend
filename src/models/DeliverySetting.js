const mongoose = require('mongoose');
const { Schema } = mongoose;

const deliverySettingsSchema = new Schema({
  // Paramètres de base
  isDeliveryEnabled: {
    type: Boolean,
    default: true,
    required: true
  },
  deliveryPreparationTime: { // Temps moyen de préparation en minutes
    type: Number,
    default: 30,
    min: 5,
    max: 180
  },
  maxDeliveryDistance: { // Distance maximale en km
    type: Number,
    default: 15,
    min: 1,
    max: 50
  },

  // Frais de livraison
  deliveryFeeType: {
    type: String,
    enum: ['FIXED', 'DYNAMIC', 'FREE', 'RESTAURANT_DEFINED'],
    default: 'FIXED'
  },
  fixedDeliveryFee: {
    type: Number,
    default: 2.5,
    min: 0
  },
  dynamicDeliveryFee: {
    type: Object,
    default: {
      baseFee: 1.5,
      perKmFee: 0.5,
      minFee: 1.5,
      maxFee: 10
    }
  },
  freeDeliveryThreshold: { // Montant minimum pour livraison gratuite
    type: Number,
    default: 25
  },

  // Zones et horaires
  deliveryZones: [{
    name: String,
    polygonCoordinates: [[Number]], // [ [lat, lng], [lat, lng], ... ]
    fee: Number
  }],
  deliveryHours: {
    type: Object,
    // start: { type: String }, // Format HH:mm
    // end: { type: String },
    default: {
      start : '08:00',
      end: '23:00'
    }
  },
  blackoutDays: [Date], // Jours sans livraison (fêtes, etc.)

  // Options de livraison
  allowScheduledDelivery: {
    type: Boolean,
    default: true
  },
  schedulingLeadTime: { // Délai minimum pour réservation en heures
    type: Number,
    default: 2
  },
  timeSlotDuration: { // Durée des créneaux en minutes
    type: Number,
    default: 30,
    enum: [15, 30, 45, 60]
  },

  // Paramètres avancés
  driverAssignmentMethod: {
    type: String,
    enum: ['AUTO', 'MANUAL', 'HYBRID'],
    default: 'AUTO'
  },
  autoAssignmentRadius: { // Rayon pour assignation auto (km)
    type: Number,
    default: 5
  },
  realTimeTracking: {
    type: Boolean,
    default: true
  },

  // Métadonnées
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index pour les recherches géospatiales
// deliverySettingsSchema.index({ 'deliveryZones.polygonCoordinates': '2dsphere' });

const DeliverySettings = mongoose.model('DeliverySetting', deliverySettingsSchema);

module.exports = DeliverySettings;