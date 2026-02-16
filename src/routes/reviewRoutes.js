const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Review = require('../models/Review');

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
    const user = await require('../models/User').findById(req.user.id).select("restaurant");
    const restaurant = await require('../models/Restaurant').findById(user.restaurant);

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

// Routes pour les avis clients
router.get('/reviews', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;

    // Récupérer tous les avis approuvés pour ce restaurant
    const reviews = await Review.find({
      restaurant: restaurantId,
      status: 'approved'
    })
    .populate('user', 'name') // Récupérer le nom de l'utilisateur
    .populate('order', 'orderNumber') // Récupérer le numéro de commande si disponible
    .sort({ createdAt: -1 }) // Plus récent en premier
    .lean();

    // Calculer les statistiques
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Compter les avis par note
    const ratingCounts = reviews.reduce((counts, review) => {
      counts[review.rating] = (counts[review.rating] || 0) + 1;
      return counts;
    }, {});

    console.log(`Récupération des avis pour le restaurant ${req.restaurant.name}: ${totalReviews} avis`);

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews,
          averageRating: parseFloat(averageRating),
          ratingCounts
        }
      }
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Répondre à un avis
router.post('/reviews/:reviewId/reply', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { reviewId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le texte de la réponse est requis'
      });
    }

    // Vérifier que l'avis appartient au restaurant
    const review = await Review.findOne({
      _id: reviewId,
      restaurant: restaurantId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Ajouter la réponse
    review.reply = {
      text: text.trim(),
      date: new Date(),
      by: req.user.id
    };

    await review.save();

    console.log(`Réponse ajoutée à l'avis ${reviewId} du restaurant ${req.restaurant.name}`);

    res.json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      data: review
    });
  } catch (error) {
    console.error('Erreur ajout réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
