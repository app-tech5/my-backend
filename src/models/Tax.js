const mongoose = require('mongoose');

// Définition du schéma pour le modèle Taxe
const TaxSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true, // Champ obligatoire
        trim: true // Supprime les espaces inutiles
    },
    name: {
        type: String,
        required: true, // Champ obligatoire
        trim: true // Supprime les espaces inutiles
    },
    rate: {
        type: Number,
        required: true, // Champ obligatoire
        min: 0 // Valeur minimale de 0
    }
}, { timestamps: true } );

// Création du modèle Taxe
const Tax = mongoose.model('Tax', TaxSchema);

// Exportation du modèle pour l'utiliser dans d'autres fichiers
module.exports = Tax;
