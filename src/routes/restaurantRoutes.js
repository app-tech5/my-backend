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

// PUT /api/restaurant/profile - Mettre à jour le profil du restaurant
router.put('/profile', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const updates = req.body;

    // Champs autorisés pour la mise à jour
    const allowedFields = ['name', 'email', 'phone', 'address', 'description', 'openingTime', 'closingTime', 'is_closed', 'commission_rate', 'collectTime'];
    const filteredUpdates = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Validation basique
    if (filteredUpdates.name && !filteredUpdates.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du restaurant ne peut pas être vide'
      });
    }

    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(filteredUpdates.email)) {
        return res.status(400).json({
          success: false,
          message: 'L\'email n\'est pas valide'
        });
      }
    }

    // Mettre à jour le restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    console.log(`Profil du restaurant mis à jour: ${updatedRestaurant.name}`);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedRestaurant
    });
  } catch (error) {
    console.error('Erreur mise à jour profil restaurant:', error);
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
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

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
      .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

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
      .populate('user', 'name phone')
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
    const restaurantId = req.restaurant._id;

    // Récupérer tous les éléments de menu pour ce restaurant
    const menuItems = await Product.find({ restaurant: restaurantId })
      .populate('restaurant', 'name')
      .sort({ created_at: -1 }); // Plus récent en premier

    console.log(`Récupération du menu pour le restaurant ${req.restaurant.name}: ${menuItems.length} éléments trouvés`);

    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error('Erreur récupération menu restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/restaurant/menu - Ajouter un élément au menu
router.post('/menu', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { name, description, price, image, preparation_time, products, discount, availability } = req.body;

    // Validation des champs requis
    if (!name || !price || !image) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prix et image sont requis'
      });
    }

    // Créer le nouvel élément de menu
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

    // Récupérer l'élément avec les données populées
    const populatedItem = await Menu.findById(newMenuItem._id).populate('restaurant', 'name');

    console.log(`Nouvel élément ajouté au menu du restaurant ${req.restaurant.name}: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Élément ajouté au menu avec succès',
      data: populatedItem
    });
  } catch (error) {
    console.error('Erreur ajout élément menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/restaurant/menu/:itemId - Modifier un élément du menu
router.put('/menu/:itemId', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;
    const updates = req.body;

    // Vérifier que l'élément appartient au restaurant
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
    }

    // Mettre à jour l'élément
    const updatedItem = await Menu.findByIdAndUpdate(
      itemId,
      { ...updates, updated_at: new Date() },
      { new: true }
    ).populate('restaurant', 'name');

    console.log(`Élément modifié dans le menu du restaurant ${req.restaurant.name}: ${updatedItem.name}`);

    res.json({
      success: true,
      message: 'Élément modifié avec succès',
      data: updatedItem
    });
  } catch (error) {
    console.error('Erreur modification élément menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/restaurant/menu/:itemId - Supprimer un élément du menu
router.delete('/menu/:itemId', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;

    // Vérifier que l'élément appartient au restaurant
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
    }

    // Supprimer l'élément
    await Menu.findByIdAndDelete(itemId);

    console.log(`Élément supprimé du menu du restaurant ${req.restaurant.name}: ${menuItem.name}`);

    res.json({
      success: true,
      message: 'Élément supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression élément menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PATCH /api/restaurant/menu/:itemId/availability - Changer la disponibilité d'un élément
router.patch('/menu/:itemId/availability', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { itemId } = req.params;
    const { availability } = req.body;

    if (typeof availability !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'La disponibilité doit être un booléen'
      });
    }

    // Vérifier que l'élément appartient au restaurant
    const menuItem = await Menu.findOne({ _id: itemId, restaurant: restaurantId });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Élément de menu non trouvé'
      });
    }

    // Mettre à jour la disponibilité
    const updatedItem = await Menu.findByIdAndUpdate(
      itemId,
      { availability, updated_at: new Date() },
      { new: true }
    ).populate('restaurant', 'name');

    console.log(`Disponibilité modifiée pour ${updatedItem.name}: ${availability}`);

    res.json({
      success: true,
      message: `Élément ${availability ? 'activé' : 'désactivé'} avec succès`,
      data: updatedItem
    });
  } catch (error) {
    console.error('Erreur changement disponibilité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Utiliser les routes reviews comme sous-routeur
router.use('/', reviewRoutes);

module.exports = router;
