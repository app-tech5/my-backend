const {
  getRecommendations,
  getSmartEta,
  getSurgePricing,
  getDeliveryQuote,
} = require('../services/intelligenceService');
const { LIMITS } = require('../constants/intelligence');
const i18n = require('../config/i18n');

function parseIds(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCoord(value) {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function fail(res, error, fallbackKey) {
  return res.status(500).json({
    message: error.message || i18n.__(fallbackKey),
  });
}

async function recommendations(req, res) {
  try {
    const restaurantId = req.query.restaurantId || req.query.restaurant;
    const productIds = parseIds(req.query.productIds || req.query.products);
    const lat = parseCoord(req.query.lat);
    const lng = parseCoord(req.query.lng);
    const limit =
      req.query.limit != null ? Number(req.query.limit) : LIMITS.DEFAULT_RECO_LIMIT;
    const data = await getRecommendations({
      restaurantId,
      productIds,
      lat,
      lng,
      limit,
      userId: req.user?.id,
    });
    return res.json(data);
  } catch (error) {
    return fail(res, error, 'intelligence_recommendations_failed');
  }
}

async function eta(req, res) {
  try {
    const restaurantId = req.query.restaurantId || req.query.restaurant;
    const lat = parseCoord(req.query.lat);
    const lng = parseCoord(req.query.lng);
    const data = await getSmartEta({ restaurantId, lat, lng });
    return res.json(data);
  } catch (error) {
    return fail(res, error, 'intelligence_eta_failed');
  }
}

async function surge(req, res) {
  try {
    const restaurantId = req.query.restaurantId || req.query.restaurant;
    const lat = parseCoord(req.query.lat);
    const lng = parseCoord(req.query.lng);
    const data = await getSurgePricing({ restaurantId, lat, lng });
    return res.json(data);
  } catch (error) {
    return fail(res, error, 'intelligence_surge_failed');
  }
}

async function quote(req, res) {
  try {
    const restaurantId =
      req.query.restaurantId || req.query.restaurant || req.body?.restaurantId;
    const productIds = parseIds(
      req.query.productIds || req.query.products || req.body?.productIds
    );
    const lat = parseCoord(req.query.lat ?? req.body?.lat);
    const lng = parseCoord(req.query.lng ?? req.body?.lng);
    const subtotal =
      req.query.subtotal != null
        ? Number(req.query.subtotal)
        : Number(req.body?.subtotal || 0);
    const data = await getDeliveryQuote({
      restaurantId,
      lat,
      lng,
      subtotal,
      productIds,
      userId: req.user?.id,
    });
    return res.json(data);
  } catch (error) {
    return fail(res, error, 'intelligence_quote_failed');
  }
}

module.exports = {
  recommendations,
  eta,
  surge,
  quote,
};
