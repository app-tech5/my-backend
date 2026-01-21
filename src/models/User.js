const mongoose = require("mongoose");
const convertToModelName = require("../utils/convertToModelName");

const UserSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, default: "" },
      password: { type: String, required: true, 
        //select: false,
        default: ''},
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      image: { type: String, default: '' },
      address: { type: String, default: '' },
      location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
      },
      // Nouveaux champs ajoutés pour Uber Eats
      role: { 
        type: String, 
        enum: ['customer', 'restaurant', 'delivery'], 
        default: 'customer' 
      },
      favorites: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurant' 
      }],
      orders: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order' 
      }],
      restaurant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Restaurant' 
      },
      deliveryZones: [{ type: String }],
      isActive: { type: Boolean, default: true },
      paymentMethods: [{
        type: { type: String, enum: ['card', 'paypal', 'cash'] },
        details: mongoose.Schema.Types.Mixed
      }],
      ratings: {
        asCustomer: { type: Number},
        asRestaurant: { type: Number },
        asDelivery: { type: Number }
      },
      deviceToken: { type: String, default: '' } // Pour les notifications push
    },
    { timestamps: true }
  );
  

// Virtual fields
UserSchema.virtual("value").get(function () {
  return this._id;
});

UserSchema.virtual("label").get(function () {
  return this.email;
});

// Inclure les virtuals dans les objets JSON et les objets classiques
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

UserSchema.pre("find", async function (next) {
  // console.log("-->", this.options.queryParams);
  const queryParams = this.options.queryParams;
  // console.log("-->", Object.keys(queryParams).length);
  if (queryParams && Object.keys(queryParams).length > 0) {
    // console.log("-->", Object.keys(queryParams).length, convertToModelName(queryParams.type));
    const Model = mongoose.model(convertToModelName(queryParams.type));

    // Récupérer tous les userId des drivers
    const items = await Model.find({}, "userId").lean();
    const itemUserIds = items.map((item) => item.userId);

    // Appliquer le filtre pour exclure ces users
    this.where({ _id: { $nin: itemUserIds } });
    console.log("-->", Model);
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
