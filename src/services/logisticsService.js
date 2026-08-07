const mongoose = require('mongoose');
const Order = require('../models/Order');
const Driver = require('../models/Driver');
const DeliverySetting = require('../models/DeliverySetting');
const i18n = require('../config/i18n');
const {
  BATCH_CANDIDATE_STATUSES,
  ACTIVE_DRIVER_ORDER_STATUSES,
  LIMITS,
} = require('../constants/logistics');

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

function dropoffCoords(order) {
  const loc = order?.user?.location;
  if (loc?.coordinates?.length === 2) {
    return { lng: toNum(loc.coordinates[0]), lat: toNum(loc.coordinates[1]) };
  }
  if (loc?.latitude != null && loc?.longitude != null) {
    return { lat: toNum(loc.latitude), lng: toNum(loc.longitude) };
  }
  return null;
}

function restaurantCoords(order) {
  const r = order?.restaurant;
  if (!r) return null;
  if (r.latitude != null && r.longitude != null) {
    return { lat: toNum(r.latitude), lng: toNum(r.longitude) };
  }
  return null;
}

async function resolveBatchRadiusKm(restaurantId) {
  if (!restaurantId) return LIMITS.DEFAULT_BATCH_RADIUS_KM;
  const setting = await DeliverySetting.findOne({ restaurant: restaurantId }).lean();
  const radius = toNum(setting?.autoAssignmentRadius, LIMITS.DEFAULT_BATCH_RADIUS_KM);
  return Math.max(0.5, Math.min(radius, 15));
}

async function findBatchCandidates({ orderId, driverId, radiusKm, driverUserId }) {
  const anchor = await Order.findById(orderId).lean();
  if (!anchor) {
    const err = new Error(i18n.__('order_not_found'));
    err.status = 404;
    throw err;
  }
  if (anchor.delivery?.type === 'pickup') {
    return { anchor, candidates: [], radiusKm: 0, batchId: null };
  }

  const drop = dropoffCoords(anchor);
  const resto = restaurantCoords(anchor);
  const origin = drop || resto;
  if (!origin) {
    return { anchor, candidates: [], radiusKm: 0, batchId: null };
  }

  let radius = radiusKm != null ? toNum(radiusKm) : await resolveBatchRadiusKm(anchor.restaurant);

  // Priority-plan drivers search a wider neighborhood for batch adds
  try {
    const userId =
      driverUserId ||
      (driverId
        ? (await Driver.findById(driverId).select('userId').lean())?.userId
        : null);
    if (userId) {
      const { getActiveBenefits } = require('./subscriptionService');
      const benefits = await getActiveBenefits(userId, 'driver');
      if (benefits?.active && benefits?.prioritySupport) {
        radius = Math.min(15, radius + (LIMITS.PRIORITY_BATCH_RADIUS_BONUS_KM || 1.5));
      }
    }
  } catch (_) {
    /* keep base radius */
  }

  const pool = await Order.find({
    _id: { $ne: anchor._id },
    'delivery.type': 'delivery',
    status: { $in: [...BATCH_CANDIDATE_STATUSES] },
    $or: [
      { driver: null },
      { driver: { $exists: false } },
      ...(driverId ? [{ driver: driverId }] : []),
    ],
  })
    .limit(40)
    .lean();

  const scored = [];
  for (const order of pool) {
    const point = dropoffCoords(order) || restaurantCoords(order);
    if (!point) continue;
    const distanceKm = haversineKm(origin.lat, origin.lng, point.lat, point.lng);
    if (distanceKm > radius) continue;
    const sameRestaurant =
      String(order.restaurant?._id || order.restaurant) ===
      String(anchor.restaurant?._id || anchor.restaurant);
    scored.push({
      order,
      distanceKm: Number(distanceKm.toFixed(2)),
      sameRestaurant,
    });
  }

  scored.sort((a, b) => {
    if (a.sameRestaurant !== b.sameRestaurant) return a.sameRestaurant ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });

  const candidates = scored.slice(0, Math.max(0, LIMITS.MAX_BATCH_SIZE - 1));
  return { anchor, candidates, radiusKm: radius, batchId: anchor.batchId || null };
}

async function acceptOrderWithBatching({ orderId, driverId, includeNearby = true }) {
  if (!orderId || !driverId) {
    const err = new Error(i18n.__('access_denied'));
    err.status = 400;
    throw err;
  }

  const { anchor, candidates, radiusKm } = await findBatchCandidates({
    orderId,
    driverId,
  });

  const batchId =
    anchor.batchId ||
    new mongoose.Types.ObjectId().toString();

  const toAssign = [anchor, ...(includeNearby ? candidates.map((c) => c.order) : [])];
  const ids = toAssign.map((o) => o._id);

  await Order.updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        driver: driverId,
        status: 'out_for_delivery',
        batchId,
      },
    }
  );

  await Driver.findByIdAndUpdate(driverId, {
    currentOrder: orderId,
    status: 'on_delivery',
  });

  const orders = await Order.find({ _id: { $in: ids } }).lean();

  return {
    batchId,
    radiusKm,
    orders,
    batchedCount: orders.length,
    nearbyAdded: Math.max(0, orders.length - 1),
  };
}

async function listDriverActiveOrders(driverId) {
  return Order.find({
    driver: driverId,
    status: { $in: [...ACTIVE_DRIVER_ORDER_STATUSES] },
  })
    .sort({ updatedAt: -1 })
    .lean();
}

async function emitDriverLocationToActiveOrders(driverDoc) {
  if (!global.io || !driverDoc?._id) return;
  const active = await Order.find({
    driver: driverDoc._id,
    status: { $in: [...ACTIVE_DRIVER_ORDER_STATUSES] },
  })
    .select('_id')
    .lean();

  const ids = active.map((o) => String(o._id));
  if (driverDoc.currentOrder && !ids.includes(String(driverDoc.currentOrder))) {
    ids.push(String(driverDoc.currentOrder));
  }

  for (const id of ids) {
    global.io.to(`order-${id}`).emit('driver-location-updated', {
      location: driverDoc.location,
      driverId: String(driverDoc._id),
      at: new Date().toISOString(),
    });
  }
}

function assertPodPayload({ photoUrl, signatureData, contactless }) {
  if (contactless && !photoUrl) {
    const err = new Error(i18n.__('logistics_pod_photo_required'));
    err.status = 400;
    throw err;
  }
  if (!signatureData && !photoUrl) {
    const err = new Error(i18n.__('logistics_pod_proof_required'));
    err.status = 400;
    throw err;
  }
}

async function completeDeliveryWithProof({
  orderId,
  driverId,
  photoUrl,
  signatureData,
  lat,
  lng,
  contactless = true,
}) {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error(i18n.__('order_not_found'));
    err.status = 404;
    throw err;
  }
  if (driverId && order.driver && String(order.driver._id || order.driver) !== String(driverId)) {
    const err = new Error(i18n.__('access_denied'));
    err.status = 403;
    throw err;
  }

  assertPodPayload({ photoUrl, signatureData, contactless: !!contactless });

  const drop = dropoffCoords(order);
  const geofenceMeters = LIMITS.DEFAULT_POD_GEOFENCE_METERS;
  let distanceMeters = null;
  let geofenceOk = true;

  if (drop && lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    distanceMeters = Math.round(haversineMeters(drop.lat, drop.lng, Number(lat), Number(lng)));
    geofenceOk = distanceMeters <= geofenceMeters;
    if (!geofenceOk && !LIMITS.POD_GEOFENCE_SOFT_FAIL) {
      const err = new Error(i18n.__('logistics_pod_geofence_failed', String(geofenceMeters)));
      err.status = 400;
      throw err;
    }
  }

  order.status = 'delivered';
  order.delivery = order.delivery || {};
  order.delivery.proofOfDelivery = {
    photoUrl: photoUrl || null,
    signatureData: signatureData || null,
    contactless: !!contactless,
    completedAt: new Date(),
    completedLocation:
      lat != null && lng != null
        ? { type: 'Point', coordinates: [Number(lng), Number(lat)] }
        : undefined,
    geofenceMeters,
    distanceMeters,
    geofenceOk,
  };
  await order.save();

  if (driverId) {
    const remaining = await Order.find({
      driver: driverId,
      status: { $in: [...ACTIVE_DRIVER_ORDER_STATUSES] },
    })
      .select('_id')
      .lean();

    const patch = { $inc: { totalDeliveries: 1 } };
    if (!remaining.length) {
      patch.currentOrder = null;
      patch.status = 'available';
    } else {
      patch.currentOrder = remaining[0]._id;
    }
    await Driver.findByIdAndUpdate(driverId, patch);
  }

  return order.toObject ? order.toObject() : order;
}

module.exports = {
  haversineKm,
  haversineMeters,
  findBatchCandidates,
  acceptOrderWithBatching,
  listDriverActiveOrders,
  emitDriverLocationToActiveOrders,
  completeDeliveryWithProof,
};
