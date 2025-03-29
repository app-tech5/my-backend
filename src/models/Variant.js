const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  // Champs obligatoires pour react-select
  name: { type: String, required: true, default: "" },       // Ex: "Double Steak"
  // Infos de base
  price: { type: Number, required: true, default: 0 },     // Prix total (10.99)
  extra: { type: Number, default: 0 },         // Supplément (2.00)
  
  // Optionnel
  available: { type: Boolean, default: true }   // En stock ?
}, { 
  timestamps: true  // Ajoute createdAt et updatedAt automatiquement
});

module.exports = mongoose.model('Variant', variantSchema);