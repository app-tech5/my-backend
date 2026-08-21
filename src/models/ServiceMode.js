const mongoose = require('mongoose');
const serviceModeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }
});
const ServiceMode = mongoose.model('ServiceMode', serviceModeSchema);
module.exports = ServiceMode;
