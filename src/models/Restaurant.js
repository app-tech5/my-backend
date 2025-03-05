const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  distance: { type: Number, required: true },
  rating: { type: Number, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  review_count: { type: Number, required: true },
  serviceModes: [
    {
      value: { type: String },
      label: { type: String },
    },
  ],
  url: { type: String, required: true },
  display_phone: { type: String, required: true },
  phone: { type: String, required: true },
  price: { type: String, required: true },
  name: { type: String, required: true },
  alias: { type: String, required: true },
  location: {
    country: { type: String, required: true },
    address3: { type: String },
    city: { type: String, required: true },
    address2: { type: String },
    address1: { type: String, required: true },
    display_address: [String],
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
  },
  id: { type: String, required: true },
  categories: [
    {
      alias: { type: String, required: true },
      title: { type: String, required: true },
      image: { type: String },
      value: { type: String },
      label: { type: String },
    },
  ],
  is_closed: { type: Boolean, required: true },
  isAvailableForDelivery: { type: Boolean },
  isActivated: { type: Boolean },
  image_url: { type: String },
  theme: { type: String },
  country: { type: String },
  city: { type: String },
  latitude: { type: String },
  description: { type: String },
  longitude: { type: String },
  image: { type: String },
  users: {
    // name: { type: String },
    // phone: { type: String },
    // email: { type: String },
    // password: { type: String },
    value: { type: String },
    label: { type: String },
  },
  address: { type: String },
  collectTime: { type: Number },
  // openingTime: { type: Date, required: true },
  // closingTime: { type: Date, required: true },
  openingTime: { type: String },
  closingTime: { type: String },
  createdAt: { type: Date, default: Date.now },
  deliveryOptions: {
    deliveryType: { type: String },
    isDeliveryAvailable: { type: Boolean },
    isOrderAmountBasedFee: { type: Boolean },
    fixedFee: { type: Number },
    distanceFee: {
      base: { type: String },
      perKm: { type: String },
    },
    isFreeDelivery: {
      enabled: { type: Boolean },
    },
    orderAmountThreshold: { type: Number },
  },
  tax: {
    id: { type: String },
    location: { type: String },
    rate: { type: String },
    name: { type: String },
    value: { type: String },
    label: { type: String },
  },
  commission_rate: { type: Number },
  reward: { type: String },
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
