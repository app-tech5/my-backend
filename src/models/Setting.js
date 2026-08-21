const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: true
  },
  language: {
    code: { type: String, required: true },
    isDefault: { type: Boolean, required: true, default: false },
    name: { type: String, required: true }
  },
  logoUrl: { type: String, default: '' }
}, { timestamps: true });

const currencyPopulate = {
  path: "currency",
  select: "code name symbol exchangeRate"
};

SettingSchema.pre("findOne", function () {
  this.populate(currencyPopulate);
});

SettingSchema.pre("find", function (next) {
  this.populate(currencyPopulate);
  next();
});

SettingSchema.pre("findOneAndUpdate", function () {
  this.populate(currencyPopulate);
});

module.exports = mongoose.model('Setting', SettingSchema);
