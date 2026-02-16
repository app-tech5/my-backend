const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserSettings = require('../models/UserSettings');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est authentifié
router.use(authMiddleware);

// GET /api/user-settings - Récupérer les paramètres utilisateur
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver les paramètres utilisateur ou les créer par défaut
    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      // Créer les paramètres par défaut si ils n'existent pas
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

// PUT /api/user-settings - Mettre à jour les paramètres utilisateur
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Validation basique
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

      // Validation du temps de préparation
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

    // Mettre à jour ou créer les paramètres
    const userSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    console.log(`Paramètres utilisateur mis à jour: ${userId}`);

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

// PATCH /api/user-settings/notifications - Mettre à jour seulement les notifications
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

// PATCH /api/user-settings/restaurant - Mettre à jour seulement les paramètres restaurant
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
