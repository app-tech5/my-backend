const mongoose = require('mongoose');

// Définition du schéma pour le modèle Taxe
const TaxSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
        trim: true,
        default: "" // Valeur par défaut pour location
    },
    name: {
        type: String,
        required: true,
        trim: true,
        default: "" // Valeur par défaut pour name
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
        default: 0 // Valeur par défaut pour rate (minimum autorisé)
    }
}, { timestamps: true });
// Création du modèle Taxe
const Tax = mongoose.model('Tax', TaxSchema);

// Exportation du modèle pour l'utiliser dans d'autres fichiers
module.exports = Tax;
