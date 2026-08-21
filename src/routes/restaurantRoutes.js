const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Report = require('../models/Report');
const User = require('../models/User');
const Menu = require('../models/Menu');
const Product = require('../models/Product');
const Review = require('../models/Review');
const reviewRoutes = require('./reviewRoutes');
const router = express.Router();
const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: res.__('access_reserved_for_restaurants')
      });
    }
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
    console.error(i18n.__('restaurant_middleware_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
};
router.use(authMiddleware);
router.use(requireRestaurant);
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.restaurant
    });
  } catch (error) {
    console.error(i18n.__('restaurant_profile_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.get('/commission', async (req, res) => {
  try {
    const { getEffectiveCommissionRate } = require('../services/commissionService');
    const effective = await getEffectiveCommissionRate(req.restaurant);
    res.json({ success: true, data: effective });
  } catch (error) {
    console.error('restaurant commission', error);
    res.status(500).json({ success: false, message: res.__('server_error') });
  }
});
router.put('/profile', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const updates = req.body;
    const allowedFields = ['name', 'email', 'phone', 'address', 'description', 'openingTime', 'closingTime', 'is_closed', 'commission_rate', 'collectTime'];
    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    if (filteredUpdates.name && !filteredUpdates.name.trim()) {
      return res.status(400).json({
        success: false,
        message: res.__('restaurant_name_cannot_be_empty')
      });
    }
    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        return res.status(400).json({
          success: false,
          message: res.__('email_not_valid')
        });
      }
    }
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true }
    );
    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: res.__('restaurant_not_found')
      });
    }
    res.json({
      success: true,
      message: res.__('profile_updated_successfully'),
      data: updatedRestaurant
    });
  } catch (error) {
    console.error(i18n.__('restaurant_profile_update_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.get('/stats', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const orders = await Order.find({ restaurant: restaurantId });
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => order.status === 'delivered').length;
    const totalRevenue = orders.
    filter((order) => order.status === 'delivered').
    reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const pendingOrders = orders.filter((order) =>
    ['pending', 'accepted', 'preparing', 'ready'].includes(order.status)
    ).length;
    const averageRating = 4.2;
    const activeMenuItems = 24;
    res.json({
      success: true,
      data: {
        todayOrders: pendingOrders,
        totalRevenue: totalRevenue,
        averageRating: averageRating,
        completedOrders: completedOrders,
        pendingOrders: pendingOrders,
        activeMenuItems: activeMenuItems
      }
    });
  } catch (error) {
    console.error(i18n.__('restaurant_stats_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const restaurantId = req.restaurant._id;
    const now = new Date();
    let startDate,endDate = now;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => order.status === 'delivered').length;
    const cancelledOrders = orders.filter((order) => order.status === 'cancelled').length;
    const totalRevenue = orders.
    filter((order) => order.status === 'delivered').
    reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cancellationRate = totalOrders > 0 ? cancelledOrders / totalOrders * 100 : 0;
    const averageRating = 4.2;
    const averagePreparationTime = 18;
    const activeCustomers = Math.floor(totalOrders * 0.8);
    const onTimeDeliveryRate = 91.7;
    const totalDeliveries = completedOrders;
    const trends = {
      revenue: 12.5,
      orders: 8.2,
      customers: -2.1,
      rating: 0.3
    };
    res.json({
      success: true,
      data: {
        period,
        generatedAt: new Date().toISOString(),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        completedOrders,
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        averageRating,
        averagePreparationTime,
        activeCustomers,
        cancellationRate: parseFloat(cancellationRate.toFixed(1)),
        onTimeDeliveryRate,
        totalDeliveries,
        trends
      }
    });
  } catch (error) {
    console.error(i18n.__('restaurant_analytics_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const restaurantId = req.restaurant._id;
    let filter = { restaurant: restaurantId };
    if (status) {
      filter.status = status;
    }
    const orders = await Order.find(filter).
    populate('user', 'name phone').
    sort({ createdAt: -1 }).
    limit(50);
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error(i18n.__('restaurant_orders_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.post('/orders/:orderId/accept', async (req, res) => {
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
    console.error(i18n.__('order_acceptance_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.post('/orders/:orderId/prepare', async (req, res) => {
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
    console.error(i18n.__('order_preparation_start_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.post('/orders/:orderId/ready', async (req, res) => {
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
    console.error(i18n.__('order_ready_marking_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.put('/orders/:orderId/status', async (req, res) => {
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
    console.error(i18n.__('order_status_change_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.get('/menu', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const menuItems = await Product.find({ restaurant: restaurantId }).
    populate('restaurant', 'name').
    sort({ created_at: -1 });
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error(i18n.__('restaurant_menu_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.post('/menu', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { name, description, price, image, preparation_time, products, discount, availability } = req.body;
    if (!name || !price || !image) {
      return res.status(400).json({
        success: false,
        message: res.__('menu_item_name_price_image_required')
      });
    }
    const newMenuItem = new Menu({
      name,
      description: description || '',
      price,
      image,
      restaurant: restaurantId,
      preparation_time: preparation_time || 15,
      products: products || [],
      discount: discount || { active: false, percentage: 0 },
      availability: availability !== undefined ? availability : true
    });
    await newMenuItem.save();
    const populatedItem = await Menu.findById(newMenuItem._id).populate('restaurant', 'name');
    res.status(201).json({
      success: true,
      message: res.__('menu_item_added_successfully'),
      data: populatedItem
    });
  } catch (error) {
    console.error(i18n.__('menu_item_addition_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.put('/menu/:itemId', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;
    const updates = req.body;
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: res.__('menu_item_not_found')
      });
    }
    const updatedItem = await Menu.findByIdAndUpdate(
      itemId,
      { ...updates, updated_at: new Date() },
      { new: true }
    ).populate('restaurant', 'name');
    res.json({
      success: true,
      message: res.__('menu_item_modified_successfully'),
      data: updatedItem
    });
  } catch (error) {
    console.error(i18n.__('menu_item_modification_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.delete('/menu/:itemId', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: res.__('menu_item_not_found')
      });
    }
    await Menu.findByIdAndDelete(itemId);
    res.json({
      success: true,
      message: res.__('menu_item_deleted_successfully')
    });
  } catch (error) {
    console.error(i18n.__('menu_item_deletion_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.patch('/menu/:itemId/availability', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;
    const { availability } = req.body;
    if (typeof availability !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: res.__('availability_must_be_boolean')
      });
    }
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: res.__('menu_item_not_found')
      });
    }
    const updatedItem = await Menu.findByIdAndUpdate(
      itemId,
      { availability, updated_at: new Date() },
      { new: true }
    ).populate('restaurant', 'name');
    res.json({
      success: true,
      message: `Élément ${availability ? 'activé' : 'désactivé'} avec succès`,
      data: updatedItem
    });
  } catch (error) {
    console.error(i18n.__('availability_change_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.use('/', reviewRoutes);
module.exports = router;
