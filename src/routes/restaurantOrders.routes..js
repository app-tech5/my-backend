const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const router = express.Router();
const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux restaurants'
      });
    }
    const User = require('../models/User');
    const Restaurant = require('../models/Restaurant');
    const user = await User.findById(req.user.id).select("restaurant");
    const restaurant = await Restaurant.findById(user.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }
    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error('Erreur middleware restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
router.use(authMiddleware);
router.get('/restaurant', requireRestaurant, async (req, res) => {
  try {
    const { status } = req.query;
    const restaurantId = req.restaurant._id;
    let filter = { restaurant: restaurantId };
    if (status) {
      filter.status = status;
    }
    const orders = await Order.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.post('/restaurant/:orderId/accept', requireRestaurant, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant._id;
    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId,
      status: 'pending'
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou déjà traitée'
      });
    }
    order.status = 'accepted';
    order.acceptedAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: 'Commande acceptée avec succès',
      data: order
    });
  } catch (error) {
    console.error('Erreur acceptation commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.post('/restaurant/:orderId/prepare', requireRestaurant, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant._id;
    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId,
      status: 'accepted'
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou statut incorrect'
      });
    }
    order.status = 'preparing';
    order.preparationStartedAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: 'Préparation démarrée',
      data: order
    });
  } catch (error) {
    console.error('Erreur démarrage préparation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.post('/restaurant/:orderId/ready', requireRestaurant, async (req, res) => {
  try {
    const { orderId } = req.params;
    const restaurantId = req.restaurant._id;
    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId,
      status: 'preparing'
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou statut incorrect'
      });
    }
    order.status = 'ready';
    order.readyAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: 'Commande prête pour le retrait',
      data: order
    });
  } catch (error) {
    console.error('Erreur marquage commande prête:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
router.put('/restaurant/:orderId/status', requireRestaurant, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const restaurantId = req.restaurant._id;
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    order.status = status;
    await order.save();
    res.json({
      success: true,
      message: `Statut changé à ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Erreur changement statut commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});
module.exports = router;
