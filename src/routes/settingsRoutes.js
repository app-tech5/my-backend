const express = require('express');
const router = express.Router();
const Settings = require('../models/Setting');
router.get("/", async (req, res) => {
    try {
        const settings = await Settings.findById("app_settings");
        if (!settings) {
            const defaultSettings = new Settings({
                _id: "app_settings", 
                appName: "Mon App",
                currency: {
                    value: "EUR",
                    label: "EUR - Euro",
                    symbol: "€",
                    code: "EUR"
                },
                language: {
                    code: "fr",
                    isDefault: true,
                    name: "Français"
                },
                createdAt: new Date(),
            });
            await defaultSettings.save();
            return res.json({
                success: true,
                data: defaultSettings
            });
        }
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message
        });
    }
});
router.put('/', async (req, res) => {
    try {
        const updatedSetting = await Settings.findByIdAndUpdate({}, req.body, { new: true });
        res.json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});
module.exports = router;
