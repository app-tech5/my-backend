const express = require('express');
const router = express.Router();
const Settings = require('../models/Setting');
const i18n = require('../config/i18n');
router.use(i18n.init);
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      const defaultSettings = new Settings({
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
        logoUrl: '',
        createdAt: new Date()
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
    res.status(500).json({
      success: false,
      message: res.__("server_error"),
      error: error.message
    });
  }
});
router.put('/', async (req, res) => {
  try {
    const updatedSetting = await Settings.findOneAndUpdate({}, req.body, { new: true });
    res.json(updatedSetting);
  } catch (error) {
    res.status(500).json({ message: res.__('server_error'), error });
  }
});
module.exports = router;
