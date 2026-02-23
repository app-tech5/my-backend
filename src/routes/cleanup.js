const express = require('express');
const deleteOrphanedFiles = require('../utils/cleanupOrphanedFiles');
const loadModels = require('../utils/loadModels');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
router.get('/cleanup', async (req, res) => {
  try {
    loadModels();
    console.log(res.__('cleanup_started'));
    await deleteOrphanedFiles(); 
    res.json({ message: res.__('cleanup_completed') });
  } catch (error) {
    console.error(res.__('cleanup_error'), error);
    res.status(500).json({ error: res.__('cleanup_error_message') });
  }
});
module.exports = router;