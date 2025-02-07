const express = require('express');
const Language = require('../models/Language');
const Setting = require('../models/Setting');

const router = express.Router();

// Récupérer toutes les langues
router.get('/', async (req, res) => {
    try {
        const languages = await Language.find();
        res.json(languages);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des langues' });
    }
});

// Ajouter une nouvelle langue
router.post("/", async (req, res) => {
  try {
    const { code, name, isDefault } = req.body;

    // Si la nouvelle langue est par défaut, désactiver l'ancienne langue par défaut
    if (isDefault) {
      await Language.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    }

    // Ajouter la nouvelle langue
    const newLanguage = new Language({ code, name, isDefault });
    await newLanguage.save();

    // Si la nouvelle langue est par défaut, mettre à jour la collection settings
    if (isDefault) {
      await Setting.findOneAndUpdate({}, { language: { code, name, isDefault } }, { upsert: true, new: true });
    }

    res.status(201).json(newLanguage);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la langue:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

// Récupérer une langue par son id
router.get('/:id', async (req, res) => {
    try {
        const language = await Language.findById(req.params.id);
        if (!language) return res.status(404).json({ error: 'Langue non trouvée' });

        res.json(language);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de la langue' });
    }
});


// Mettre à jour une langue
router.put('/:id', async (req, res) => {
    try {
        const updatedLanguage = await Language.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedLanguage) return res.status(404).json({ error: 'Langue non trouvée' });

        // Si la mise à jour définit cette langue comme langue par défaut
        if (req.body.isDefault) {
            // Désactiver l'ancienne langue par défaut
            await Language.updateMany(
                { _id: { $ne: req.params.id }, isDefault: true }, 
                { $set: { isDefault: false } }
            );

            // Mettre à jour settings avec la nouvelle langue par défaut
            await Setting.findOneAndUpdate({}, { language: updatedLanguage }, { upsert: true, new: true });
        }

        res.json(updatedLanguage);
    } catch (error) {
        res.status(400).json({ error: 'Erreur lors de la mise à jour de la langue' });
    }
});

// Supprimer une langue
router.delete('/:id', async (req, res) => {
    try {
        const deletedLanguage = await Language.findByIdAndDelete(req.params.id);

        if (!deletedLanguage) return res.status(404).json({ error: 'Langue non trouvée' });

        res.json({ message: 'Langue supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression de la langue' });
    }
});


module.exports = router;
