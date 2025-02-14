const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  distance: { type: Number, required: true },
  rating: { type: Number, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  review_count: { type: Number, required: true },
  transactions: [String],
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
    },
  ],
  is_closed: { type: Boolean, required: true },
  image_url: { type: String },
  theme: { type: String },
  country: { type: String },
  city: { type: String },
  latitude: { type: String },
  description: { type: String },
  longitude: { type: String },
  image: { type: String },
  owner: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
  },
  address: { type: String },
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
