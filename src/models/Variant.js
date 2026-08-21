const mongoose = require('mongoose');
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, default: "" },
  price: { type: Number, required: true, default: 0 },
  extra: { type: Number, default: 0 },
  available: { type: Boolean, default: true }
}, {
  timestamps: true
});
module.exports = mongoose.model('Variant', variantSchema);
