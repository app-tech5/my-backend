const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true},
  exchangeRate: { type: Number, required: true },
  name: { type: String, required: true},
  symbol: { type: String, required: true},
}, { timestamps: true });

module.exports = mongoose.model('Currency', CurrencySchema);