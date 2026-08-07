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
  /** Seconds that priority-plan drivers get first look at new pending jobs */
  PRIORITY_JOB_LEAD_SECONDS: Number(process.env.LOGISTICS_PRIORITY_JOB_LEAD_S) || 90,
  /** Extra batch search radius (km) for priority-plan drivers */
  PRIORITY_BATCH_RADIUS_BONUS_KM: Number(process.env.LOGISTICS_PRIORITY_BATCH_BONUS_KM) || 1.5,
});

module.exports = {
  BATCH_CANDIDATE_STATUSES,
  ACTIVE_DRIVER_ORDER_STATUSES,
  LIMITS,
};
