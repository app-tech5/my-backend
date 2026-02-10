const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Report = require('../models/Report');
const User = require('../models/User');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est un restaurant
const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux restaurants'
      });
    }

    // Récupérer le restaurant complet
    // const restaurant = await Restaurant.findById(req.user.id);

    const user = await User.findById(req.user.id).select("restaurant");


    const restaurant = await Restaurant.findById(user.restaurant);

    // const restaurant = await Restaurant.findOne({
    //   "users.value": req.user.id
    // });

    // console.log('Restaurant trouvé:', restaurant, user.restaurant);
    
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

// Appliquer les middlewares
router.use(authMiddleware);
router.use(requireRestaurant);

// === PROFIL RESTAURANT ===

// GET /api/restaurant/profile - Récupérer le profil du restaurant
router.get('/profile', async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.restaurant
    });
  } catch (error) {
    console.error('Erreur récupération profil restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// === STATISTIQUES ===

// GET /api/restaurant/stats - Statistiques générales du restaurant
router.get('/stats', async (req, res) => {
  try {
    console.log('Récupération des statistiques pour le restaurant:', req.restaurant.name);
    const restaurantId = req.restaurant._id;

    // Récupérer les commandes du restaurant
    const orders = await Order.find({ restaurant: restaurantId });

    // Calculer les statistiques
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const pendingOrders = orders.filter(order =>
      ['pending', 'accepted', 'preparing', 'ready'].includes(order.status)
    ).length;

    // Calculer la note moyenne (simulation pour l'instant)
    const averageRating = 4.2;

    // Nombre d'articles actifs dans le menu (simulation)
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
    console.error('Erreur récupération stats restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// === ANALYTICS ===

// GET /api/restaurant/analytics - Analytics détaillées du restaurant
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const restaurantId = req.restaurant._id;

    // Définir la plage de dates selon la période
    const now = new Date();
    let startDate, endDate = now;

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

    // Récupérer les commandes de la période
    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculer les métriques
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Données simulées pour certaines métriques
    const averageRating = 4.2;
    const averagePreparationTime = 18;
    const activeCustomers = Math.floor(totalOrders * 0.8); // Estimation
    const onTimeDeliveryRate = 91.7;
    const totalDeliveries = completedOrders;

    // Tendances (simulées pour l'instant)
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
    console.error('Erreur récupération analytics restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// === COMMANDES ===

// GET /api/restaurant/orders - Liste des commandes du restaurant
router.get('/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const restaurantId = req.restaurant._id;

    let filter = { restaurant: restaurantId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50); // Limiter à 50 commandes récentes

      console.log(`Récupération des commandes pour le restaurant ${req.restaurant.name} avec filtre:`, filter, `Nombre de commandes trouvées: ${orders.length}`);

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

// POST /api/restaurant/orders/:orderId/accept - Accepter une commande
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

// POST /api/restaurant/orders/:orderId/prepare - Démarrer la préparation
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

// POST /api/restaurant/orders/:orderId/ready - Commande prête
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

// PUT /api/restaurant/orders/:orderId/status - Changer le statut d'une commande
router.put('/orders/:orderId/status', async (req, res) => {
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

// === MENU ===

// GET /api/restaurant/menu - Récupérer le menu du restaurant
router.get('/menu', async (req, res) => {
  try {
    // Pour l'instant, retourner un menu vide ou simulé
    // TODO: Implémenter la gestion du menu quand le modèle sera prêt
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Erreur récupération menu restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
