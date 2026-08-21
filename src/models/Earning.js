const mongoose = require("mongoose");
const User = require("./User");
const Driver = require("./Driver");
const EarningsSchema = new mongoose.Schema(
  {
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
    transactions: [
    {
      date: { type: Date, required: true },
      restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
      },
      amount: { type: Number, required: true },
      commission: { type: Number, required: true },
      delivery_fee: { type: Number, required: true },
      status: {
        type: String,
        enum: ["completed", "pending"],
        required: true
      }
    }],

    payouts: [
    {
      date: { type: Date, required: true },
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "payouts.recipientType"
      },
      recipientType: {
        type: String,
        required: true,
        enum: ["Restaurant", "Driver"]
      },
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["completed", "pending"],
        required: true
      }
    }]

  },
  { timestamps: true }
);
EarningsSchema.pre("findOne", function (next) {
  this.populate({
    path: "transactions.restaurant",
    select: "name"
  });
  next();
});
EarningsSchema.post("findOne", async function (doc) {
  if (doc && doc.payouts && doc.payouts.length) {
    for (let payout of doc.payouts) {
      if (payout.recipientType !== "Restaurant") {
        try {
          const recipientDoc = await Driver.findById(payout.recipient).select(
            "userId"
          );
          const recipient = recipientDoc.toObject();
          const { userId } = recipient;
          const { name } = userId;
          payout.recipient = { name };
        } catch (error) {
        }
      }
    }
  }
});
module.exports = mongoose.model("Earning", EarningsSchema);
