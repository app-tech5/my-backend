const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    // === Identification ===
    title: { 
      type: String, 
      required: [true, 'Un titre est requis'], 
      maxlength: [100, 'Le titre ne doit pas dépasser 100 caractères'] 
    },
    reportType: { 
      type: String, 
      required: true,
      enum: {
        values: ['sales', 'driver_performance', 'restaurant_analytics', 'customer_behavior', 'delivery_metrics'],
        message: 'Type de rapport non valide'
      },
      index: true
    },

    // === Période concernée ===
    dateRange: {
      start: { 
        type: Date, 
        required: true,
        validate: {
          validator: function(v) {
            return v <= this.dateRange.end;
          },
          message: 'La date de début doit être antérieure à la date de fin'
        }
      },
      end: { 
        type: Date, 
        required: true 
      }
    },

    // === Filtres applicables ===
    filters: {
      restaurantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
      driverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
      orderStatuses: [String],
      paymentMethods: [String]
    },

    // === Métriques pré-calculées ===
    // metrics: {
    //   // Général
    //   totalOrders: { type: Number, default: 0 },
    //   completedOrders: { type: Number, default: 0 },
    //   cancellationRate: { type: Number, min: 0, max: 100 },
      
    //   // Financier
    //   grossRevenue: { type: Number, min: 0 },
    //   netProfit: { type: Number, min: 0 },
    //   averageOrderValue: { type: Number, min: 0 },
      
    //   // Livraison
    //   averageDeliveryTime: { type: Number, min: 0 }, // en minutes
    //   onTimeDeliveryRate: { type: Number, min: 0, max: 100 },
      
    //   // Client
    //   newCustomers: { type: Number, default: 0 },
    //   repeatCustomerRate: { type: Number, min: 0, max: 100 }
    // },
    metrics: {
        // Sales metrics
        totalOrders: Number,
        completedOrders: Number,
        cancellationRate: Number,
        grossRevenue: Number,
        netProfit: Number,
        averageOrderValue: Number,
        averageDeliveryTime: Number,
        
        // Driver performance metrics
        totalDeliveries: Number,
        onTimeRate: Number,
        averageRating: Number,
        totalEarnings: Number,
        
        // Customer behavior metrics
        activeCustomers: Number,
        repeatOrderRate: Number,
        averageOrdersPerCustomer: Number,
        favoriteCategories: [String]
      },
    // === Données détaillées (optionnel) ===
    rawData: mongoose.Schema.Types.Mixed, // Pour stocker les données brutes si nécessaire

    // === Métadonnées ===
    generatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: String, // Ex: 'weekly', 'monthly'
    lastGeneratedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reportSchema.pre("find", function () {
    this.populate({
      path: "generatedBy",
      select: "name", // Sélectionne les champs du modèle Use
    });
  });

// === Méthodes personnalisées ===
reportSchema.methods.generatePDF = function() {
  // Logique de génération de PDF (à implémenter)
  return `/reports/${this._id}/download`;
};

// === Hooks (pré-agrégation) ===
reportSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Exemple de pré-calcul (à adapter)
    if (!this.metrics.cancellationRate && this.metrics.totalOrders > 0) {
      this.metrics.cancellationRate = 
        ((this.metrics.totalOrders - this.metrics.completedOrders) / this.metrics.totalOrders) * 100;
    }
  }
  next();
});

// === Validation étendue ===
reportSchema.path('metrics.netProfit').validate(function(value) {
  return value <= this.metrics.grossRevenue;
}, 'Le profit net ne peut pas dépasser le revenu brut');

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
