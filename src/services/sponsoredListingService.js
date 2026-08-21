const SponsoredListing = require('../models/SponsoredListing');

function serializeListing(doc) {
  if (!doc) return null;
  const restaurant = doc.restaurant;
  return {
    id: String(doc._id),
    name: doc.name,
    placement: doc.placement,
    status: doc.status,
    bidAmount: Number(doc.bidAmount) || 0,
    currency: doc.currency || 'USD',
    dailyBudget: doc.dailyBudget == null ? null : Number(doc.dailyBudget),
    priority: Number(doc.priority) || 0,
    headline: doc.headline || '',
    image: doc.image || '',
    startAt: doc.startAt,
    endAt: doc.endAt,
    impressions: Number(doc.impressions) || 0,
    clicks: Number(doc.clicks) || 0,
    restaurantId:
    restaurant && restaurant._id ?
    String(restaurant._id) :
    restaurant ?
    String(restaurant) :
    null,
    restaurantName:
    restaurant && restaurant.name ? restaurant.name : null,
    restaurantImage:
    restaurant && (restaurant.image || restaurant.coverImage) ?
    restaurant.image || restaurant.coverImage :
    null
  };
}

async function getActiveListings({ placement } = {}) {
  const now = new Date();
  const filter = {
    status: 'active',
    startAt: { $lte: now },
    endAt: { $gte: now }
  };
  if (placement === 'search') {
    filter.placement = { $in: ['search', 'both'] };
  } else if (placement === 'home_banner') {
    filter.placement = { $in: ['home_banner', 'both'] };
  }

  const docs = await SponsoredListing.find(filter).
  populate('restaurant', 'name image coverImage isActivated is_closed').
  sort({ priority: -1, bidAmount: -1 }).
  limit(50);

  return docs.
  filter((d) => d.restaurant && d.restaurant.isActivated !== false).
  map(serializeListing);
}

async function listForRestaurant(restaurantId) {
  const docs = await SponsoredListing.find({ restaurant: restaurantId }).
  sort({ createdAt: -1 }).
  populate('restaurant', 'name image');
  return docs.map(serializeListing);
}

async function createListing(payload) {
  const doc = await SponsoredListing.create(payload);
  await doc.populate('restaurant', 'name image');
  return serializeListing(doc);
}

async function activateListing(id, restaurantId) {
  const doc = await SponsoredListing.findOne({
    _id: id,
    ...(restaurantId ? { restaurant: restaurantId } : {})
  });
  if (!doc) return null;
  doc.status = 'active';
  if (!doc.startAt || doc.startAt > new Date()) doc.startAt = new Date();
  await doc.save();
  await doc.populate('restaurant', 'name image');
  return serializeListing(doc);
}

async function trackEvent(id, type) {
  const field = type === 'click' ? 'clicks' : 'impressions';
  await SponsoredListing.updateOne({ _id: id }, { $inc: { [field]: 1 } });
}

module.exports = {
  serializeListing,
  getActiveListings,
  listForRestaurant,
  createListing,
  activateListing,
  trackEvent
};
