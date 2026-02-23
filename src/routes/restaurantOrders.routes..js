const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const router = express.Router();
const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: res.__('access_reserved_for_restaurants')
      });
    }
    const User = require('../models/User');
    const Restaurant = require('../models/Restaurant');
    const user = await User.findById(req.user.id).select("restaurant");
    const restaurant = await Restaurant.findById(user.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: res.__('restaurant_not_found')
      });
    }
    req.restaurant = restaurant;
    next();
  } catch (error) {
    console.error('Erreur middleware restaurant:', error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
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
      message: res.__('server_error')
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
        message: res.__('order_not_found_or_already_processed')
      });
    }
    order.status = 'accepted';
    order.acceptedAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: res.__('order_accepted_successfully'),
      data: order
    });
  } catch (error) {
    console.error('Erreur acceptation commande:', error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
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
        message: res.__('order_not_found_or_wrong_status')
      });
    }
    order.status = 'preparing';
    order.preparationStartedAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: res.__('preparation_started'),
      data: order
    });
  } catch (error) {
    console.error('Erreur démarrage préparation:', error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
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
        message: res.__('order_not_found_or_wrong_status')
      });
    }
    order.status = 'ready';
    order.readyAt = new Date();
    await order.save();
    res.json({
      success: true,
      message: res.__('order_ready_for_pickup'),
      data: order
    });
  } catch (error) {
    console.error('Erreur marquage commande prête:', error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
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
        message: res.__('invalid_status')
      });
    }
    const order = await Order.findOne({
      _id: orderId,
      restaurant: restaurantId
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: res.__('order_not_found')
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
      message: res.__('server_error')
    });
  }
});
module.exports = router;
