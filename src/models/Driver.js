const mongoose = require("mongoose");
const { Schema } = mongoose;
const autopopulate = require("mongoose-autopopulate");

// Schéma principal pour la collection `drivers`
const DriverSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true,
        default: new mongoose.Types.ObjectId()
     }, // Référence à l'utilisateur dans la collection `users`
    licenseNumber: { type: String, required: true, unique: true, default: "" }, // Numéro de permis de conduire
    users: { type: Object, default: { value: "", label: "" } },
    vehicle: {
        type: Object,
    //   type: { type: String, required: true }, // Type de véhicule (ex: "scooter", "voiture")
    //   model: { type: String, required: true }, // Modèle du véhicule
    //   licensePlate: { type: String, required: true }, // Numéro de plaque d'immatriculation
      default: {
        type: "",
        model: "",
        licensePlate: ""
      }
    },
    // vehicleType: { type: String, required: true },
    // vehicleModel: { type: String, required: true },
    // vehicleLicensePlate: { type: String, required: true },
      location: {
        type: { type: String, default: "Point",
            enum: ["Point"],
            required: true
        }, // Type de données géospatiales
        coordinates: { type: [Number], default: [0, 0], required: true }, // [longitude, latitude]
      },
    status: {
      type: String,
      // enum: ["available", "on_delivery", "offline"],
      default: "offline",
    }, // Statut du driver
    rating: { type: Number, default: 0, min: 0, max: 5 }, // Note moyenne du driver
    totalDeliveries: { type: Number, default: 0 }, // Nombre total de livraisons
    documents: [
      {
        type: { type: String, required: true }, // Type de document (ex: "permis de conduire")
        fileUrl: { type: String, required: true }, // URL ou chemin du document
      },
    ],
    isApproved: { type: Boolean, default: false }, // Statut d'approbation par l'admin
    //   createdAt: { type: Date, default: Date.now }, // Date de création
    //   updatedAt: { type: Date, default: Date.now }, // Date de mise à jour
  },
  { id: false, timestamps: true }
);

// DriverSchema.virtual('users').get(function () {
//     // return this.userId;
//     return {value:'', label:''};
//     // return this._populatedUser || this.userId;
// });
// DriverSchema.set('toJSON', { virtuals: true });
// DriverSchema.set('toObject', { virtuals: true });

// Index géospatial pour la localisation (permet des requêtes géospatiales efficaces)
// DriverSchema.index({ location: "2dsphere" });

// Middleware pour mettre à jour la date de mise à jour avant chaque sauvegarde

function transformUsersField(doc) {
  doc.userId = doc.users.value;
  doc.users = {
    value: doc.users.value,
    label: doc.users.label,
  };
  doc.updatedAt = Date.now();
}
DriverSchema.pre("save", function (next) {
  // this.userId = new mongoose.Types.ObjectId(this.users.value);
  //   this.userId = this.users.value;
  //   this.users = {
  //     value: this.users.value,
  //     label: this.users.label,
  //   };
  //   console.log("this.users.value----------------->", this);
  //   this.updatedAt = Date.now();
  transformUsersField(this);
  next();
});

DriverSchema.pre("findOneAndUpdate", function (next) {
    const update = this.getUpdate();
    console.log(update)
    transformUsersField(update);
    // this.setUpdate(update);
    next();
  });

//pre
DriverSchema.pre("findOne", function () {
  this.populate({
    path: "userId",
    select: "name email phone image value label", // Sélectionne les champs du modèle Use
  });
});

DriverSchema.post("findOne", function (doc) {
  // if (doc && doc.userId && typeof doc.userId === "object") {
  //     doc._populatedUser = doc.userId;
  //     doc.userId = doc.userId._id; // On remet l'ID après populate
  // }
});
// DriverSchema.post("findOne", function (doc) {
//     // if (doc && doc.userId) {
//     //     doc.value = doc.userId._id; // userId est l'objet peuplé
//     //     doc.label = doc.userId.email;
//     // }

//     console.log(doc.userId);
// });

// Middleware pour transformer `userId` avant la sauvegarde
DriverSchema.pre("validate", function (next) {
  console.log("this.users.value", this)
//   this.userId = new mongoose.Types.ObjectId();
  //   try {

  //     this.userId = new mongoose.Types.ObjectId(this.users.value);
  //   } catch (error) {
  //     return next(new Error("Invalid userId format "+ this));
  //   }
  next();
});

// Export du modèle
const Driver = mongoose.model("Driver", DriverSchema);
module.exports = Driver;
