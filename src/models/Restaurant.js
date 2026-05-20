const mongoose = require('mongoose');
const i18n = require('../config/i18n');
const { notifyResource } = require('../services/notifyResource');

const restaurantSchema = new mongoose.Schema({
  distance: { type: Number, required: true, default: 0 },
  rating: { type: Number, required: true, default: 0 },
  review_count: { type: Number, required: true, default: 0 },
  serviceModes: { 
    type: String, 
    enum: ["delivery", "pickup"], 
    default: "pending" 
  },
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
      value: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, default: null },
      label: { type: String, default: "" },
    },
  ],
  is_closed: { type: Boolean, required: true, default: false },
  isAvailableForDelivery: { type: Boolean, default: false },
  isActivated: { type: Boolean, default: false },
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
  collectTime: { type: Number, default: 20 },
  openingTime: { type: String, default: "09:00" },
  closingTime: { type: String, default: "21:00" },
  createdAt: { type: Date, default: Date.now },
  tax: {
    type: Object,
    default:{
      id: { type: String },
      location:"",
      rate:"0.00",
      name:"TVA",
      value: { type: mongoose.Schema.Types.ObjectId, ref: "Tax", required: true},
      label:"",
    }
  },
  commission_rate: { type: Number, default: 15 },
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
restaurantSchema.pre('findOneAndUpdate', async function (next) {
  this.previousRestaurant = await this.model.findOne(this.getQuery());
  next();
});
restaurantSchema.post('findOneAndUpdate', async function (doc) {
  const io = global.io;
  if (!io || !doc) return;

  io.to(`restaurant-${doc._id}`).emit('restaurant-updated', {
    restaurant: doc,
  });

  try {
    if (!doc?.isActivated || this.previousRestaurant?.isActivated) return;
    const restaurantId = String(doc._id);
    await notifyResource({
      userFilter: { restaurant: doc._id, role: 'restaurant' },
      titleKey: 'restaurant_activated_title',
      messageKey: 'restaurant_activated_message',
      messageArgs: [doc.name || restaurantId],
      type: 'new_restaurant',
      relatedEntity: doc._id,
      relatedEntityModel: 'Restaurant',
      action: 'view_restaurant',
      actionData: { restaurantId },
      pushData: { type: 'restaurant_activated', restaurantId },
    });
  } catch (error) {
    console.error(i18n.__('restaurant_activation_notification_error'), error);
  }
});
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
