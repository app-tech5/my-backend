const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Review = require('../models/Review');
const i18n = require('../config/i18n');
const router = express.Router();
router.use(i18n.init);
const requireRestaurant = async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'restaurant') {
      return res.status(403).json({
        success: false,
        message: res.__('access_reserved_for_restaurants')
      });
    }
    const user = await require('../models/User').findById(req.user.id).select("restaurant");
    const restaurant = await require('../models/Restaurant').findById(user.restaurant);
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
router.get('/reviews', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const reviews = await Review.find({
      restaurant: restaurantId,
      status: 'approved'
    })
    .populate('user', 'name') 
    .populate('order', 'orderNumber') 
    .sort({ createdAt: -1 }) 
    .lean();
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1)
      : 0;
    const ratingCounts = reviews.reduce((counts, review) => {
      counts[review.rating] = (counts[review.rating] || 0) + 1;
      return counts;
    }, {});
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
    console.error(i18n.__('reviews_retrieval_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
router.post('/reviews/:reviewId/reply', async (req, res) => {
  try {
    const restaurantId = req.restaurant._id;
    const { reviewId } = req.params;
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: res.__('reply_text_required')
      });
    }
    const review = await Review.findOne({
      _id: reviewId,
      restaurant: restaurantId
    });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: res.__('review_not_found')
      });
    }
    review.reply = {
      text: text.trim(),
      date: new Date(),
      by: req.user.id
    };
    await review.save();
    res.json({
      success: true,
      message: res.__('reply_added_successfully'),
      data: review
    });
  } catch (error) {
    console.error(i18n.__('reply_addition_error'), error);
    res.status(500).json({
      success: false,
      message: res.__('server_error')
    });
  }
});
module.exports = router;
