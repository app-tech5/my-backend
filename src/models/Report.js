const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema(
  {
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
    filters: {
      restaurantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
      driverIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
      orderStatuses: [String],
      paymentMethods: [String]
    },
    metrics: {
        totalOrders: Number,
        completedOrders: Number,
        cancellationRate: Number,
        grossRevenue: Number,
        netProfit: Number,
        averageOrderValue: Number,
        averageDeliveryTime: Number,
        totalDeliveries: Number,
        onTimeRate: Number,
        averageRating: Number,
        totalEarnings: Number,
        activeCustomers: Number,
        repeatOrderRate: Number,
        averageOrdersPerCustomer: Number,
        favoriteCategories: [String]
      },
    rawData: mongoose.Schema.Types.Mixed, 
    generatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    isRecurring: { type: Boolean, default: false },
    recurrencePattern: String, 
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
      select: "name", 
    });
  });
reportSchema.methods.generatePDF = function() {
  return `/reports/${this._id}/download`;
};
reportSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.metrics.cancellationRate && this.metrics.totalOrders > 0) {
      this.metrics.cancellationRate = 
        ((this.metrics.totalOrders - this.metrics.completedOrders) / this.metrics.totalOrders) * 100;
    }
  }
  next();
});
reportSchema.path('metrics.netProfit').validate(function(value) {
  return value <= this.metrics.grossRevenue;
}, 'Le profit net ne peut pas dépasser le revenu brut');
const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
