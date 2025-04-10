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
    ref: 'Restaurant' // Assurez-vous que 'Restaurant' correspond au nom de votre modèle de restaurant
  }
});

const ServiceMode = mongoose.model('ServiceMode', serviceModeSchema);

module.exports = ServiceMode;
