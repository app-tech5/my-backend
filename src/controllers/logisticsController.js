const {
  findBatchCandidates,
  acceptOrderWithBatching,
  listDriverActiveOrders,
  completeDeliveryWithProof
} = require('../services/logisticsService');
const i18n = require('../config/i18n');

function fail(res, error, fallbackKey) {
  const status = error.status || 500;
  return res.status(status).json({
    message: error.message || i18n.__(fallbackKey || 'server_error')
  });
}

async function batchSuggestions(req, res) {
  try {
    const orderId = req.params.orderId || req.query.orderId;
    const driverId = req.user?.driverId || req.query.driverId || req.user?.id;
    const data = await findBatchCandidates({
      orderId,
      driverId,
      driverUserId: req.user?.id
    });
    return res.json({
      radiusKm: data.radiusKm,
      batchId: data.batchId,
      candidates: data.candidates.map((c) => ({
        _id: c.order._id,
        distanceKm: c.distanceKm,
        sameRestaurant: c.sameRestaurant,
        address: c.order.delivery?.address,
        restaurant: c.order.restaurant,
        status: c.order.status
      }))
    });
  } catch (error) {
    return fail(res, error, 'logistics_batch_failed');
  }
}

async function acceptBatch(req, res) {
  try {
    const orderId = req.params.orderId || req.body?.orderId;
    const driverId =
    req.body?.driverId || req.user?.driverId || req.user?.id;
    const includeNearby = req.body?.includeNearby !== false;
    const data = await acceptOrderWithBatching({
      orderId,
      driverId,
      includeNearby
    });
    return res.json(data);
  } catch (error) {
    return fail(res, error, 'logistics_batch_failed');
  }
}

async function activeOrders(req, res) {
  try {
    const driverId = req.params.driverId || req.user?.driverId || req.user?.id;
    const orders = await listDriverActiveOrders(driverId);
    return res.json({ orders, count: orders.length });
  } catch (error) {
    return fail(res, error, 'server_error');
  }
}

async function completeWithProof(req, res) {
  try {
    const orderId = req.params.orderId;
    const driverId = req.body?.driverId || req.user?.driverId || req.user?.id;
    const order = await completeDeliveryWithProof({
      orderId,
      driverId,
      photoUrl: req.body?.photoUrl,
      signatureData: req.body?.signatureData,
      lat: req.body?.lat,
      lng: req.body?.lng,
      contactless: req.body?.contactless !== false
    });
    return res.json(order);
  } catch (error) {
    return fail(res, error, 'logistics_pod_failed');
  }
}

module.exports = {
  batchSuggestions,
  acceptBatch,
  activeOrders,
  completeWithProof
};
