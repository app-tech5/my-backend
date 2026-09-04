const { getRedisClient, isRedisReady } = require('../config/redis');
const { LIMITS } = require('../constants/logistics');

const GEO_KEY = process.env.REDIS_DRIVERS_GEO_KEY || 'drivers:geo';
const ONLINE_FOR_DISPATCH = new Set(['available']);

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function coordsFromDriver(driverDoc) {
  const c = driverDoc?.location?.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const lng = toNum(c[0]);
  const lat = toNum(c[1]);
  if (lng == null || lat == null) return null;
  if (lng === 0 && lat === 0) return null;
  return { lng, lat };
}

async function removeDriverFromGeo(driverId) {
  const redis = await getRedisClient();
  if (!redis) return false;
  const member = String(driverId);
  await redis.zRem(GEO_KEY, member);
  return true;
}

async function upsertDriverInGeo(driverId, lng, lat) {
  const redis = await getRedisClient();
  if (!redis) return false;
  await redis.geoAdd(GEO_KEY, {
    longitude: lng,
    latitude: lat,
    member: String(driverId)
  });
  return true;
}

/**
 * Keep the Redis GEO index in sync with driver status + GPS.
 * Only `available` drivers stay searchable for nearest-dispatch.
 */
async function syncDriverGeo(driverDoc) {
  if (!driverDoc?._id) return { ok: false, reason: 'no_driver' };

  const id = driverDoc._id;
  const status = driverDoc.status || 'offline';

  if (!ONLINE_FOR_DISPATCH.has(status)) {
    const removed = await removeDriverFromGeo(id);
    return { ok: removed, action: 'remove', reason: 'not_available' };
  }

  const point = coordsFromDriver(driverDoc);
  if (!point) {
    const removed = await removeDriverFromGeo(id);
    return { ok: removed, action: 'remove', reason: 'no_coords' };
  }

  const added = await upsertDriverInGeo(id, point.lng, point.lat);
  return { ok: added, action: 'upsert', ...point };
}

/**
 * Redis GEOSEARCH: nearest online drivers within radiusKm of (lng, lat).
 * Returns [] when Redis is unavailable (optional infra).
 */
async function findNearestDrivers({
  lng,
  lat,
  radiusKm = LIMITS.DEFAULT_DISPATCH_RADIUS_KM,
  count = LIMITS.DEFAULT_DISPATCH_COUNT
} = {}) {
  const longitude = toNum(lng);
  const latitude = toNum(lat);
  if (longitude == null || latitude == null) {
    const err = new Error('lng and lat are required');
    err.status = 400;
    throw err;
  }

  const redis = await getRedisClient();
  if (!redis || !isRedisReady()) {
    return {
      engine: 'unavailable',
      radiusKm: toNum(radiusKm) ?? LIMITS.DEFAULT_DISPATCH_RADIUS_KM,
      drivers: []
    };
  }

  const radius = Math.max(
    0.1,
    Math.min(toNum(radiusKm) ?? LIMITS.DEFAULT_DISPATCH_RADIUS_KM, 50)
  );
  const limit = Math.max(1, Math.min(toNum(count) ?? LIMITS.DEFAULT_DISPATCH_COUNT, 50));

  const rows = await redis.geoSearchWith(
    GEO_KEY,
    { longitude, latitude },
    { radius: radius, unit: 'km' },
    { SORT: 'ASC', COUNT: limit, WITHDIST: true }
  );

  const drivers = (rows || []).map((row) => {
    const member = row?.member ?? row?.[0];
    const distanceKm = toNum(row?.distance ?? row?.[1]);
    return {
      driverId: String(member),
      distanceKm: distanceKm != null ? Number(distanceKm.toFixed(3)) : null
    };
  });

  return {
    engine: 'redis-geosearch',
    radiusKm: radius,
    count: drivers.length,
    drivers
  };
}

async function clearDriverGeoIndex() {
  const redis = await getRedisClient();
  if (!redis) return false;
  await redis.del(GEO_KEY);
  return true;
}

module.exports = {
  GEO_KEY,
  syncDriverGeo,
  findNearestDrivers,
  removeDriverFromGeo,
  upsertDriverInGeo,
  clearDriverGeoIndex,
  coordsFromDriver
};
