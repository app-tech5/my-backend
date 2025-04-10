const mongoose = require("mongoose");
const { Schema } = mongoose;

const restaurantReportSchema = new Schema(
  {
    // Restaurant concerné
    restaurant: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // Utilisateur qui fait le signalement (peut être anonyme)
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Type de signalement
    reportType: {
      type: String,
      required: true,
      enum: [
        "hygiene",
        "food_quality",
        "service_quality",
        "fake_menu",
        "price_issue",
        "delivery_issue",
        "false_advertising",
        "other",
      ],
    },
    otherDetails: {
      type: String,
      required: function () {
        return this.reportType === "other";
      },
      maxlength: 500,
    },

    // Détails du signalement
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    orderReference: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    evidencePhotos: [
      {
        type: String, // URLs des images
        validate: {
          validator: function (arr) {
            return arr.length <= 5;
          },
          message: "Maximum 5 photos de preuve",
        },
      },
    ],

    // Statut et traitement
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "rejected"],
      default: "pending",
    },
    adminNotes: [
      {
        note: {
          type: String,
          maxlength: 500,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    resolutionDetails: {
      type: String,
      maxlength: 1000,
    },

    // Gravité
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Métadonnées
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index pour les recherches
restaurantReportSchema.index({ restaurant: 1, status: 1 });
restaurantReportSchema.index({ reportedBy: 1, createdAt: -1 });
restaurantReportSchema.index({ reportType: 1, status: 1 });

restaurantReportSchema.pre("find", function () {
  this.populate([
    {
      path: "restaurant",
      select: "name", // Sélectionne les champs du modèle Use
    },
    {
      path: "resolvedBy",
      select: "name",
    },
    { path: "reportedBy", select: "name" },
  ]);
});

// Middleware pour mettre à jour updatedAt
restaurantReportSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Méthode pour ajouter une note admin
restaurantReportSchema.methods.addAdminNote = function (noteContent, adminId) {
  this.adminNotes.push({
    note: noteContent,
    addedBy: adminId,
  });
  return this.save();
};

// Méthode pour changer le statut
restaurantReportSchema.methods.updateStatus = function (
  newStatus,
  resolvedById,
  resolutionDetails
) {
  this.status = newStatus;

  if (newStatus === "resolved" || newStatus === "rejected") {
    this.resolvedBy = resolvedById;
    this.resolvedAt = new Date();
    this.resolutionDetails = resolutionDetails || "";
  }

  return this.save();
};

// Virtual pour le nombre de jours en attente
restaurantReportSchema.virtual("daysPending").get(function () {
  if (this.status !== "pending") return 0;
  const diff = new Date() - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

const RestaurantReport = mongoose.model(
  "RestaurantReport",
  restaurantReportSchema
);

module.exports = RestaurantReport;
