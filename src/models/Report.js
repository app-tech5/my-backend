const mongoose = require("mongoose");
const i18n = require('../config/i18n');
const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, i18n.__('title_is_required')],
      maxlength: [100, i18n.__('title_max_length_100')]
    },
    reportType: {
      type: String,
      required: true,
      enum: {
        values: ['sales', 'driver_performance', 'restaurant_analytics', 'customer_behavior', 'delivery_metrics'],
        message: i18n.__('invalid_report_type')
      },
      index: true
    },
    dateRange: {
      start: {
        type: Date,
        required: true,
        validate: {
          validator: function (v) {
            return v <= this.dateRange.end;
          },
          message: i18n.__('start_date_must_be_before_end_date')
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
    select: "name"
  });
});
reportSchema.methods.generatePDF = function () {
  return `/reports/${this._id}/download`;
};
reportSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.metrics.cancellationRate && this.metrics.totalOrders > 0) {
      this.metrics.cancellationRate =
      (this.metrics.totalOrders - this.metrics.completedOrders) / this.metrics.totalOrders * 100;
    }
  }
  next();
});
reportSchema.path('metrics.netProfit').validate(function (value) {
  return value <= this.metrics.grossRevenue;
}, i18n.__('net_profit_cannot_exceed_gross_revenue'));
const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
