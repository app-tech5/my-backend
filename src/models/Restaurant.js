const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  distance: { type: Number, required: true, default: 0 },
  rating: { type: Number, required: true, default: 0 },
  // coordinates: {
  //   latitude: { type: Number, required: true, default: 0 },
  //   longitude: { type: Number, required: true, default: 0 },
  // },
  review_count: { type: Number, required: true, default: 0 },
  serviceModes: { 
    type: String, 
    enum: ["delivery", "pickup"], 
    default: "pending" 
  },
  // serviceModes: [
  //   {
  //     //value: { type: String, default: "" },
  //     value: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceMode", required: true},
  //     label: { type: String, default: "" },
  //   },
  // ],
  url: { type: String, required: true, default: "" },
  display_phone: { type: String, required: true, default: "" },
  phone: { type: String, required: true, default: "" },
  price: { type: String, required: true, default: "", select: false },
  name: { type: String, required: true, default: "" },
  alias: { type: String, required: true, default: "" },
  id: { type: String, required: true, default: "" },
  categories: [
    {
      alias: { type: String, required: true, default: "" },
      title: { type: String, required: true, default: "" },
      image: { type: String, default: "" },
      // value: { type: String, default: "" },
      value: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, default: null },
      label: { type: String, default: "" },
    },
  ],
  is_closed: { type: Boolean, required: true, default: false },
  isAvailableForDelivery: { type: Boolean, default: false },
  isActivated: { type: Boolean, default: true },
  image_url: { type: String, default: "" },
  theme: { type: String, default: "default" },
  country: { type: String, default: "" },
  city: { type: String, default: "" },
  latitude: { type: String, default: "" },
  description: { type: String, default: "" },
  longitude: { type: String, default: "" },
  image: { type: String, default: "" },
  users: {
    value: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    label: { type: String },
  },
  address: { type: String, default: "" },
  collectTime: { type: Number, default: 0 },
  openingTime: { type: String, default: "09:00" },
  closingTime: { type: String, default: "21:00" },
  createdAt: { type: Date, default: Date.now },
  // deliveryOptions: {
  //   deliveryType: { type: String, default: "standard" },
  //   isDeliveryAvailable: { type: Boolean, default: true },
  //   isOrderAmountBasedFee: { type: Boolean, default: false },
  //   fixedFee: { type: Number, default: 2.5 },
  //   distanceFee: {
  //     base: { type: String, default: "1.00" },
  //     perKm: { type: String, default: "0.50" },
  //   },
  //   isFreeDelivery: {
  //     enabled: { type: Boolean, default: false },
  //   },
  //   orderAmountThreshold: { type: Number, default: 20 },
  // },
  tax: {
    type: Object,
    default:{

      id: { type: String },
      location:"",
      rate:"0.00",
      name:"TVA",
      // value:"",
      value: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", required: true},
      label:"",

    }
  },
  commission_rate: { type: Number, default: 0 },
  reward: { type: String, default: "" },
});

restaurantSchema.pre("find", function (next) {
  this.populate([
    { path: "serviceModes.value", model: "ServiceMode" },
    { path: "categories.value", model: "Category" },
    { path: "users.value", model: "User" },
    { path: "tax.value", model: "Tax" },
  ]);
  next();
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
