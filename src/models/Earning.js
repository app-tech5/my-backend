const mongoose = require("mongoose");

const EarningsSchema = new mongoose.Schema({
  total_earnings: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true, default: "XAF" },
  time_period: {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true }
  },
  breakdown: {
    platform_commission: { type: Number, required: true, default: 0 },
    restaurant_earnings: { type: Number, required: true, default: 0 },
    delivery_earnings: { type: Number, required: true, default: 0 },
    taxes: { type: Number, required: true, default: 0 }
  },
  transactions: [{
    date: { type: Date, required: true },
    restaurant: { type: String, required: true },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true },
    delivery_fee: { type: Number, required: true },
    status: { type: String, enum: ["completed", "pending"], required: true }
  }],
  payouts: [{
    date: { type: Date, required: true },
    recipient: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["completed", "pending"], required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Earning", EarningsSchema);
