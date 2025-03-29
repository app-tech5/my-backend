const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, default: ""},
  exchangeRate: { type: Number, required: true, default: 0 },
  name: { type: String, required: true, default: ""},
  symbol: { type: String, required: true, default: ""},
}, { timestamps: true });

module.exports = mongoose.model('Currency', CurrencySchema);