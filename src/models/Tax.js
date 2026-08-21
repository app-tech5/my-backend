const mongoose = require('mongoose');
const TaxSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true,
    default: ""
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: ""
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  }
}, { timestamps: true });
const Tax = mongoose.model('Tax', TaxSchema);
module.exports = Tax;
