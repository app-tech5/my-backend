const express = require('express');
const router = express.Router();
const Settings = require('../models/Setting');

// Exemple : Récupérer tous les settings
router.get("/", async (req, res) => {
    try {
        const settings = await Settings.findById("app_settings");

        if (!settings) {
            // 🔥 Si le document n'existe pas, on l'initialise
            const defaultSettings = new Settings({
                _id: "app_settings", // 👈 ID fixé ici
                appName: "Mon App",
                defaultCurrency: {
                    value: "USD",
                    label: "USD - US Dollar",
                    symbol: "$",
                },
                language: {
                    code: "en",
                    isDefault: true,
                    name: "English"
                },
                createdAt: new Date(),
            });

            await defaultSettings.save();
            return res.json(defaultSettings);
        }

        res.json(settings);
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
});


// Exemple : Mettre à jour un setting
router.put('/', async (req, res) => {
    try {
        const updatedSetting = await Settings.findByIdAndUpdate({}, req.body, { new: true });
        res.json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

module.exports = router;
