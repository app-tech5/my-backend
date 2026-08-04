/**
 * Logistics tunables: order batching, tracking fan-out, proof of delivery.
 */

const BATCH_CANDIDATE_STATUSES = Object.freeze(['ready', 'out_for_delivery']);

const ACTIVE_DRIVER_ORDER_STATUSES = Object.freeze(['ready', 'out_for_delivery']);

const LIMITS = Object.freeze({
  DEFAULT_BATCH_RADIUS_KM: Number(process.env.LOGISTICS_BATCH_RADIUS_KM) || 2.5,
  MAX_BATCH_SIZE: Number(process.env.LOGISTICS_MAX_BATCH_SIZE) || 3,
  DEFAULT_POD_GEOFENCE_METERS: Number(process.env.LOGISTICS_POD_GEOFENCE_M) || 150,
  POD_GEOFENCE_SOFT_FAIL: process.env.LOGISTICS_POD_GEOFENCE_SOFT !== 'false',
});

module.exports = {
  BATCH_CANDIDATE_STATUSES,
  ACTIVE_DRIVER_ORDER_STATUSES,
  LIMITS,
};
