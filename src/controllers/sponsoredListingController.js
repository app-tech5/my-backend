const Restaurant = require('../models/Restaurant');
const i18n = require('../config/i18n');
const {
  getActiveListings,
  listForRestaurant,
  createListing,
  activateListing,
  trackEvent,
  serializeListing
} = require('../services/sponsoredListingService');
const SponsoredListing = require('../models/SponsoredListing');

async function resolveRestaurantForUser(user) {
  if (!user?._id && !user?.id) return null;
  const userId = user._id || user.id;
  if (user.type === 'restaurant' || user.role === 'restaurant') {
    const User = require('../models/User');
    const u = await User.findById(userId).select('restaurant');
    if (u?.restaurant) {
      return Restaurant.findById(u.restaurant);
    }
    return Restaurant.findOne({ 'users.value': userId });
  }
  return null;
}

exports.getActive = async (req, res) => {
  try {
    const placement = req.query.placement || undefined;
    const listings = await getActiveListings({ placement });
    res.json({ listings });
  } catch (error) {
    console.error('sponsored getActive', error);
    res.status(500).json({
      message: i18n.__('errors.server') || 'Server error',
      error: error.message
    });
  }
};

exports.listMine = async (req, res) => {
  try {
    const restaurant = await resolveRestaurantForUser(req.user);
    if (!restaurant) {
      return res.status(403).json({ message: 'Restaurant only' });
    }
    const listings = await listForRestaurant(restaurant._id);
    res.json({ listings });
  } catch (error) {
    console.error('sponsored listMine', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createMine = async (req, res) => {
  try {
    const restaurant = await resolveRestaurantForUser(req.user);
    if (!restaurant) {
      return res.status(403).json({ message: 'Restaurant only' });
    }
    const {
      name,
      placement = 'search',
      bidAmount = 0,
      dailyBudget,
      priority = 10,
      headline = '',
      image = '',
      startAt,
      endAt,
      status = 'active'
    } = req.body || {};

    if (!name || !startAt || !endAt) {
      return res.status(400).json({ message: 'name, startAt and endAt required' });
    }

    const listing = await createListing({
      restaurant: restaurant._id,
      name,
      placement,
      bidAmount: Number(bidAmount) || 0,
      dailyBudget: dailyBudget == null ? null : Number(dailyBudget),
      priority: Number(priority) || 10,
      headline,
      image,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      status: ['draft', 'pending_payment', 'active', 'paused'].includes(status) ?
      status :
      'active',
      createdBy: req.user._id || req.user.id
    });

    res.status(201).json({ listing });
  } catch (error) {
    console.error('sponsored createMine', error);
    res.status(500).json({ message: error.message });
  }
};

exports.activateMine = async (req, res) => {
  try {
    const restaurant = await resolveRestaurantForUser(req.user);
    if (!restaurant) {
      return res.status(403).json({ message: 'Restaurant only' });
    }
    const listing = await activateListing(req.params.id, restaurant._id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    res.json({ listing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.track = async (req, res) => {
  try {
    const type = req.body?.type === 'click' ? 'click' : 'impression';
    await trackEvent(req.params.id, type);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await SponsoredListing.findById(req.params.id).populate(
      'restaurant',
      'name image'
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ listing: serializeListing(doc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
