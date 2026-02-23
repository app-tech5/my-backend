const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserSettings = require('../models/UserSettings');
const router = express.Router();
router.use(authMiddleware);
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    let userSettings = await UserSettings.findOne({ userId });
    if (!userSettings) {
      const user = await require('../models/User').findById(userId);
      if (!user || !user.restaurant) {
        return res.status(400).json({
          success: false,
          message: 'Utilisateur non associé à un restaurant'
        });
      }
      userSettings = new UserSettings({
        userId,
        restaurantId: user.restaurant,
        notifications: {
          newOrders: true,
          orderUpdates: true,
          lowStock: false,
          marketing: false,
        },
        restaurantSettings: {
          autoAcceptOrders: false,
          preparationTime: 15,
        }
      });
      await userSettings.save();
    }
    res.json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    console.error('Erreur récupération paramètres utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    if (updates.notifications) {
      const allowedNotifKeys = ['newOrders', 'orderUpdates', 'lowStock', 'marketing'];
      for (const key in updates.notifications) {
        if (!allowedNotifKeys.includes(key)) {
          delete updates.notifications[key];
        }
      }
    }
    if (updates.restaurantSettings) {
      const allowedSettingsKeys = ['autoAcceptOrders', 'preparationTime'];
      for (const key in updates.restaurantSettings) {
        if (!allowedSettingsKeys.includes(key)) {
          delete updates.restaurantSettings[key];
        }
      }
      if (updates.restaurantSettings.preparationTime !== undefined) {
        const prepTime = parseInt(updates.restaurantSettings.preparationTime);
        if (isNaN(prepTime) || prepTime < 1 || prepTime > 120) {
          return res.status(400).json({
            success: false,
            message: 'Temps de préparation invalide (1-120 minutes)'
          });
        }
        updates.restaurantSettings.preparationTime = prepTime;
      }
    }
    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      data: userSettings
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètres utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.patch('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications } = req.body;
    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Données de notification invalides'
      });
    }
    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { 'notifications': notifications } },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Notifications mises à jour',
      data: userSettings.notifications
    });
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.patch('/restaurant', async (req, res) => {
  try {
    const userId = req.user.id;
    const { restaurantSettings } = req.body;
    if (!restaurantSettings || typeof restaurantSettings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Données de paramètres restaurant invalides'
      });
    }
    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { 'restaurantSettings': restaurantSettings } },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Paramètres restaurant mis à jour',
      data: userSettings.restaurantSettings
    });
  } catch (error) {
    console.error('Erreur mise à jour paramètres restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
module.exports = router;
