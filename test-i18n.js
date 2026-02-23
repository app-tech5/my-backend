// Fichier de test pour vérifier la détection des chaînes non traduites
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  // Cette ligne devrait déclencher un avertissement
  res.json({ message: 'Ceci est une chaîne non traduite' });

  // Cette ligne ne devrait pas déclencher d'avertissement
  res.json({ message: res.__('translated_message') });
});

module.exports = router;
