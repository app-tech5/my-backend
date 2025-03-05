const express = require('express');
const deleteOrphanedFiles = require('../utils/cleanupOrphanedFiles'); // Importez la fonction
const loadModels = require('../utils/loadModels');
const router = express.Router();

// Route pour nettoyer les fichiers orphelins
router.get('/cleanup', async (req, res) => {
  try {
    loadModels();
    console.log('Début du nettoyage des fichiers orphelins...');
    await deleteOrphanedFiles(); // Exécuter la fonction
    res.json({ message: 'Nettoyage des fichiers orphelins terminé.' });
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers orphelins :', error);
    res.status(500).json({ error: 'Erreur lors du nettoyage des fichiers orphelins' });
  }
});

module.exports = router;