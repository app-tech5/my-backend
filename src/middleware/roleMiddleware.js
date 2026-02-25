const i18n = require('../config/i18n');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: i18n.__("access_denied") });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: i18n.__("access_denied") });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');
const requireRestaurant = requireRole('restaurant');
const requireDelivery = requireRole('delivery');

module.exports = {
  requireRole,
  requireAdmin,
  requireRestaurant,
  requireDelivery
};