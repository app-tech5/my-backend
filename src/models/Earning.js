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
          // default: new mongoose.Types.ObjectId()
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
          refPath: "payouts.recipientType", // Référence dynamique
        },
        recipientType: {
          type: String,
          required: true,
          enum: ["Restaurant", "Driver"], // Doit être soit "Restaurant" soit "Driver"
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

// EarningsSchema.pre("findOne", function () {
//   this.populate({
//     path: "transactions.restaurant",
//     select: "name"
//   }).populate({
//     path: "payouts.recipient",
//     select: "name userId",
//   }).populate({
//       model: "User",
//       select: "name"
//   })
// });

EarningsSchema.pre("findOne", function (next) {
  this.populate({
    path: "transactions.restaurant",
    select: "name",
  });

  // Continuer l'exécution du hook `pre`
  next();
});

EarningsSchema.post("findOne", async function (doc) {
  console.log("Document trouvé :", doc); // Log du document trouvé

  if (doc && doc.payouts && doc.payouts.length) {
    console.log("Payouts existants :", doc.payouts); // Log des payouts

    for (let payout of doc.payouts) {
      console.log("Vérification du recipient :", payout.recipient); // Log du recipient

      if (payout.recipientType !== "Restaurant") {
        console.log("Recipient n'est pas un Restaurant, peuplage avec User");

        try {
          const recipientDoc = await Driver.findById(payout.recipient).select(
            "userId"
          );

          const recipient = recipientDoc.toObject();
          console.log("Recipient trouvé :", recipient); // Log du recipient trouvé
          const { userId } = recipient; // Extraire `userId` de l'objet
          console.log("userId extrait :", userId); // Log de userId extrait
          const { name } = userId;
          console.log("name extrait :", name); // Log de name extrait
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

// EarningsSchema.pre("findOne", function () {
//   this.populate({
//       path: "items.item",
//       select: "name image price"
//   }).populate({
//     path: "driver",
//     select: "userId vehicle", // Sélectionne les champs du modèle Driver
//     populate: {
//         path: "userId",
//         model: "User",
//         select: "name phone image" // Sélectionne les champs du modèle User
//     }
// });
// });

// EarningsSchema.pre("findOne", function () {
//   this.populate(
//     // [
//     {
//       path: "transactions.restaurant",
//       select: "name", // On ne récupère que le nom du restaurant
//     },
//   //   {
//   //     path: "category",
//   //     select: "name", // On suppose que votre modèle Category a un champ "name"
//   //   },
//   // ]
// );
// });

module.exports = mongoose.model("Earning", EarningsSchema);
