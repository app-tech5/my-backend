const express = require('express');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const User = require('../models/User');
const router = express.Router();
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 Récupération du profil driver pour l\'utilisateur:', req.user.id);
    const driver = await Driver.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone image');
    if (!driver) {
      console.log('🟠 Aucun profil driver trouvé pour l\'utilisateur:', req.user.id);
      return res.status(404).json({
        message: 'Profil driver non trouvé',
        errorType: 'profile_not_found'
      });
    }
    console.log('✅ Profil driver trouvé:', driver._id);
    res.json(driver);
  } catch (error) {
    console.error('🔴 Erreur lors de la récupération du profil driver:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 Création du profil driver pour l\'utilisateur:', req.user.id);
    const existingDriver = await Driver.findOne({ userId: req.user.id });
    if (existingDriver) {
      console.log('🟠 Profil driver déjà existant pour l\'utilisateur:', req.user.id);
      return res.status(400).json({
        message: 'Vous avez déjà un profil driver',
        errorType: 'profile_exists'
      });
    }
    const { licenseNumber, vehicle } = req.body;
    if (!licenseNumber) {
      return res.status(400).json({
        message: 'Numéro de permis requis',
        errorType: 'license_required'
      });
    }
    const newDriver = new Driver({
      userId: req.user.id,
      licenseNumber,
      vehicle: vehicle || {},
      status: 'offline',
      location: {
        type: 'Point',
        coordinates: [0, 0] 
      }
    });
    await newDriver.save();
    await newDriver.populate('userId', 'name email phone');
    console.log('✅ Profil driver créé:', newDriver._id);
    res.status(201).json(newDriver);
  } catch (error) {
    console.error('🔴 Erreur lors de la création du profil driver:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 Mise à jour du profil driver pour l\'utilisateur:', req.user.id);
    const updates = req.body;
    delete updates.userId;
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone image');
    if (!driver) {
      console.log('🟠 Profil driver non trouvé pour la mise à jour');
      return res.status(404).json({ message: 'Profil driver non trouvé' });
    }
    console.log('✅ Profil driver mis à jour:', driver._id);
    res.json(driver);
  } catch (error) {
    console.error('🔴 Erreur lors de la mise à jour du profil driver:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
router.put('/status', authenticateToken, async (req, res) => {
  try {
    console.log('🔵 Mise à jour du statut driver pour l\'utilisateur:', req.user.id);
    const { status, location } = req.body;
    const updateData = { status };
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.longitude || 0, location.latitude || 0]
      };
    }
    const driver = await Driver.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone image');
    if (!driver) {
      console.log('🟠 Profil driver non trouvé pour la mise à jour du statut');
      return res.status(404).json({ message: 'Profil driver non trouvé' });
    }
    console.log('✅ Statut driver mis à jour:', driver.status);
    res.json(driver);
  } catch (error) {
    console.error('🔴 Erreur lors de la mise à jour du statut driver:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
module.exports = router;
