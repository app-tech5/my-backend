const mongoose = require("mongoose");
const convertToModelName = require("../utils/convertToModelName");
const UserSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, default: "" },
      password: { type: String, required: true, 
        default: ''},
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      image: { type: String, default: '' },
      address: { type: String, default: '' },
      location: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null }
      },
      role: { 
        type: String, 
        enum: ['customer', 'restaurant', 'delivery', 'admin'], 
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
      stripeCustomerId: { type: String, default: '' },
      deviceToken: { type: String, default: '' } 
    },
    { timestamps: true }
  );
UserSchema.virtual("value").get(function () {
  return this._id;
});
UserSchema.virtual("label").get(function () {
  return this.email;
});
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });
UserSchema.pre("find", async function (next) {
  const queryParams = this.options.queryParams;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const Model = mongoose.model(convertToModelName(queryParams.type));
    const items = await Model.find({}, "userId").lean();
    const itemUserIds = items.map((item) => item.userId);
    this.where({ _id: { $nin: itemUserIds } });
  }
  next();
});
module.exports = mongoose.model("User", UserSchema);
