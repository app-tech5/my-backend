const mongoose = require("mongoose");
const salesReportSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: false, 
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalSales: {
      type: Number,
      required: true,
      default: 0,
    },
    totalOrders: {
      type: Number,
      required: true,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      required: true,
      default: 0,
    },
    salesByCategory: [
      {
        category: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    deliveryFees: {
      type: Number,
      default: 0,
    },
    taxesCollected: {
      type: Number,
      default: 0,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);
salesReportSchema.pre("find", function () {
  this.populate([
    {
      path: "restaurant",
      select: "name", 
    },
    {
      path: "generatedBy",
      select: "name", 
    },
  ]);
});
salesReportSchema.pre("findOne", function () {
  this.populate([
    {
      path: "generatedBy",
      select: "name", 
    },
  ]);
});
module.exports = mongoose.model("SalesReport", salesReportSchema);
