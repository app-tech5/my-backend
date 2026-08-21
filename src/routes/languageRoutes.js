const express = require('express');
const Language = require('../models/Language');
const Setting = require('../models/Setting');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.get('/', async (req, res) => {
  try {
    const languages = await Language.find();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: res.__('error_retrieving_languages') });
  }
});
router.post("/", async (req, res) => {
  try {
    const { code, name, isDefault } = req.body;
    if (isDefault) {
      await Language.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    }
    const newLanguage = new Language({ code, name, isDefault });
    await newLanguage.save();
    if (isDefault) {
      await Setting.findOneAndUpdate({}, { language: { code, name, isDefault } }, { upsert: true, new: true });
    }
    res.status(201).json(newLanguage);
  } catch (error) {
    res.status(500).json({ error: res.__("server_error") });
  }
});
module.exports = router;
router.get('/:id', async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) return res.status(404).json({ error: res.__('language_not_found') });
    res.json(language);
  } catch (error) {
    res.status(500).json({ error: res.__('error_retrieving_language') });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const updatedLanguage = await Language.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedLanguage) return res.status(404).json({ error: res.__('language_not_found') });
    if (req.body.isDefault) {
      await Language.updateMany(
        { _id: { $ne: req.params.id }, isDefault: true },
        { $set: { isDefault: false } }
      );
      await Setting.findOneAndUpdate({}, { language: updatedLanguage }, { upsert: true, new: true });
    }
    res.json(updatedLanguage);
  } catch (error) {
    res.status(400).json({ error: res.__('error_updating_language') });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const deletedLanguage = await Language.findByIdAndDelete(req.params.id);
    if (!deletedLanguage) return res.status(404).json({ error: res.__('language_not_found') });
    res.json({ message: res.__('language_deleted') });
  } catch (error) {
    res.status(500).json({ error: res.__('error_deleting_language') });
  }
});
module.exports = router;
