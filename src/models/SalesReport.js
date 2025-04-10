// models/SalesReport.js
const mongoose = require("mongoose");

const salesReportSchema = new mongoose.Schema(
  {
    // Référence au restaurant (si applicable)
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: false, // Optionnel, selon si le rapport est global ou par restaurant
    },
    // Période couverte par le rapport
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Données agrégées
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
    // Détails par catégorie (ex: nourriture, boissons)
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
    // Métriques supplémentaires
    deliveryFees: {
      type: Number,
      default: 0,
    },
    taxesCollected: {
      type: Number,
      default: 0,
    },
    // Référence à l'utilisateur qui a généré le rapport (admin)
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Statut (ex: "pending", "completed", "failed")
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
      select: "name", // Sélectionne les champs du modèle Use
    },
    {
      path: "generatedBy",
      select: "name", // Sélectionne les champs du modèle Use
    },
  ]);
});

salesReportSchema.pre("findOne", function () {
  this.populate([
    // {
    //   path: "restaurant",
    //   select: "name", // Sélectionne les champs du modèle Use
    // },
    {
      path: "generatedBy",
      select: "name", // Sélectionne les champs du modèle Use
    },
  ]);
});

module.exports = mongoose.model("SalesReport", salesReportSchema);
