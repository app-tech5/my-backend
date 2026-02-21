const mongoose = require("mongoose");
const User = require("./User");
const Driver = require("./Driver");
const EarningsSchema = new mongoose.Schema(
  {
    total_earnings: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: "XAF" },
    time_period: {
      start_date: { type: Date, required: true },
      end_date: { type: Date, required: true },
    },
    breakdown: {
      platform_commission: { type: Number, required: true, default: 0 },
      restaurant_earnings: { type: Number, required: true, default: 0 },
      delivery_earnings: { type: Number, required: true, default: 0 },
      taxes: { type: Number, required: true, default: 0 },
    },
    transactions: [
      {
        date: { type: Date, required: true },
        restaurant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Restaurant",
          required: true,
        },
        amount: { type: Number, required: true },
        commission: { type: Number, required: true },
        delivery_fee: { type: Number, required: true },
        status: {
          type: String,
          enum: ["completed", "pending"],
          required: true,
        },
      },
    ],
    payouts: [
      {
        date: { type: Date, required: true },
        recipient: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "payouts.recipientType", 
        },
        recipientType: {
          type: String,
          required: true,
          enum: ["Restaurant", "Driver"], 
        },
        amount: { type: Number, required: true },
        status: {
          type: String,
          enum: ["completed", "pending"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
EarningsSchema.pre("findOne", function (next) {
  this.populate({
    path: "transactions.restaurant",
    select: "name",
  });
  next();
});
EarningsSchema.post("findOne", async function (doc) {
  console.log("Document trouvé :", doc); 
  if (doc && doc.payouts && doc.payouts.length) {
    console.log("Payouts existants :", doc.payouts); 
    for (let payout of doc.payouts) {
      console.log("Vérification du recipient :", payout.recipient); 
      if (payout.recipientType !== "Restaurant") {
        console.log("Recipient n'est pas un Restaurant, peuplage avec User");
        try {
          const recipientDoc = await Driver.findById(payout.recipient).select(
            "userId"
          );
          const recipient = recipientDoc.toObject();
          console.log("Recipient trouvé :", recipient); 
          const { userId } = recipient; 
          console.log("userId extrait :", userId); 
          const { name } = userId;
          console.log("name extrait :", name); 
          payout.recipient = { name };
        } catch (error) {
          console.log("Erreur lors de la recherche du recipient :", error);
        }
      } else {
        console.log("Recipient est un Restaurant, pas de peuplement");
      }
    }
  } else {
    console.log("Aucun payout trouvé dans le document.");
  }
});
module.exports = mongoose.model("Earning", EarningsSchema);
