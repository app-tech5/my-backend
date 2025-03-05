const mongoose = require('mongoose');

const serviceModeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
});

const ServiceMode = mongoose.model('ServiceMode', serviceModeSchema);

module.exports = ServiceMode;
