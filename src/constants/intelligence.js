/**
 * Tunables for recommendations / ETA / surge pricing.
 * Override URLs via env without code changes.
 */

const ACTIVE_ORDER_STATUSES = Object.freeze([
  'pending',
  'preparing',
  'ready',
  'out_for_delivery',
]);

const KITCHEN_STATUSES = Object.freeze(['pending', 'preparing', 'ready']);

const ONLINE_DRIVER_STATUSES = Object.freeze(['available', 'busy', 'on_delivery']);

const PAIR_ORDER_STATUSES = Object.freeze([
  'delivered',
  'out_for_delivery',
  'ready',
  'preparing',
]);

const TIME_OF_DAY = Object.freeze({
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  SNACK: 'snack',
  DINNER: 'dinner',
  LATE: 'late',
});

const WEATHER_CONDITION = Object.freeze({
  FAIR: 'fair',
  RAIN: 'rain',
  HOT: 'hot',
  COLD: 'cold',
});

const ROUTING_SOURCE = Object.freeze({
  OSRM: 'osrm',
  HEURISTIC: 'heuristic',
});

const WEATHER_SOURCE = Object.freeze({
  OPEN_METEO: 'open-meteo',
  HEURISTIC: 'heuristic',
});

const TIME_TAGS = Object.freeze({
  [TIME_OF_DAY.BREAKFAST]: Object.freeze([
    'breakfast',
    'coffee',
    'pastry',
    'juice',
    'tea',
    'brunch',
  ]),
  [TIME_OF_DAY.LUNCH]: Object.freeze([
    'lunch',
    'salad',
    'sandwich',
    'bowl',
    'popular',
  ]),
  [TIME_OF_DAY.SNACK]: Object.freeze([
    'snack',
    'dessert',
    'drink',
    'coffee',
    'sweet',
  ]),
  [TIME_OF_DAY.DINNER]: Object.freeze([
    'dinner',
    'main',
    'popular',
    'spicy',
    'comfort',
  ]),
  [TIME_OF_DAY.LATE]: Object.freeze([
    'comfort',
    'pizza',
    'burger',
    'drink',
    'dessert',
  ]),
});

const WEATHER_TAGS = Object.freeze({
  [WEATHER_CONDITION.RAIN]: Object.freeze([
    'soup',
    'comfort',
    'hot',
    'tea',
    'coffee',
    'dessert',
  ]),
  [WEATHER_CONDITION.HOT]: Object.freeze([
    'salad',
    'cold',
    'drink',
    'juice',
    'ice',
    'fresh',
    'vegan',
  ]),
  [WEATHER_CONDITION.COLD]: Object.freeze([
    'soup',
    'comfort',
    'hot',
    'coffee',
    'tea',
    'stew',
  ]),
  [WEATHER_CONDITION.FAIR]: Object.freeze(['popular', 'chef', 'featured']),
});

const SCORE = Object.freeze({
  PAIR_WEIGHT: 5,
  RATING_WEIGHT: 1.2,
  RATING_COUNT_BONUS: 1,
  RATING_COUNT_THRESHOLD: 10,
  TIME_TAG_BONUS: 2.5,
  WEATHER_TAG_BONUS: 2,
  DISCOUNT_BONUS: 1.5,
});

const LIMITS = Object.freeze({
  DEFAULT_RECO_LIMIT: 6,
  MAX_RECO_LIMIT: 12,
  MIN_RECO_LIMIT: 1,
  PRODUCT_CANDIDATES: 80,
  RECENT_ORDERS_FOR_PAIRS: 120,
  USER_HISTORY_ORDERS: 40,
  USER_HISTORY_IDS: 8,
  HTTP_TIMEOUT_MS: Number(process.env.INTELLIGENCE_HTTP_TIMEOUT_MS) || 3500,
  DEFAULT_PREP_MINUTES: 30,
  DEFAULT_FIXED_FEE: 2.5,
  DEFAULT_DYNAMIC_BASE_FEE: 1.5,
  DEFAULT_DYNAMIC_PER_KM: 0.5,
  DEFAULT_DYNAMIC_MIN_FEE: 1.5,
  DEFAULT_DYNAMIC_MAX_FEE: 10,
  MIN_ETA_MINUTES: 15,
  ETA_RANGE_PADDING: 5,
  MAX_KITCHEN_EXTRA_MINUTES: 45,
  KITCHEN_MINUTES_PER_ORDER: 4,
  MIN_TRAVEL_MINUTES: 6,
  FALLBACK_TRAVEL_MINUTES: 12,
  MIN_ROUTE_MINUTES: 4,
  RUSH_TRAVEL_MIN_PER_KM: 5.2,
  NORMAL_TRAVEL_MIN_PER_KM: 3.8,
  RUSH_ROUTE_MULTIPLIER: 1.25,
  PREP_MIN_FACTOR: 0.7,
  KITCHEN_MIN_FACTOR: 0.5,
  TRAVEL_MIN_FACTOR: 0.8,
  WEATHER_RAIN_EXTRA_MINUTES: 6,
  WEATHER_COLD_EXTRA_MINUTES: 3,
  DEMAND_WINDOW_MS: 60 * 60 * 1000,
  SURGE_HIGH_DEMAND_RATIO: 2.2,
  SURGE_ELEVATED_DEMAND_RATIO: 1.4,
  SURGE_HIGH_DEMAND_BONUS: 0.35,
  SURGE_ELEVATED_DEMAND_BONUS: 0.2,
  SURGE_LOW_DRIVERS_BONUS: 0.15,
  SURGE_RAIN_BONUS: 0.2,
  SURGE_EXTREME_WEATHER_BONUS: 0.1,
  SURGE_RUSH_BONUS: 0.1,
  SURGE_MAX_MULTIPLIER: 2,
  SURGE_ACTIVE_THRESHOLD: 1.05,
  SURGE_NO_DRIVER_HIGH_ORDERS: 2,
  SURGE_NO_DRIVER_RATIO_ORDERS: 3,
  SURGE_NO_DRIVER_RATIO: 2,
  WEATHER_RAIN_PRECIP_MM: 0.4,
  WEATHER_RAIN_CODE_MIN: 51,
  WEATHER_HOT_C: 28,
  WEATHER_COLD_C: 8,
  DEFAULT_TEMP_C: 18,
});

const HOUR_WINDOWS = Object.freeze({
  BREAKFAST: Object.freeze({ start: 5, end: 11 }),
  LUNCH: Object.freeze({ start: 11, end: 15 }),
  SNACK: Object.freeze({ start: 15, end: 18 }),
  DINNER: Object.freeze({ start: 18, end: 23 }),
  RUSH: Object.freeze([
    Object.freeze({ start: 7, end: 9 }),
    Object.freeze({ start: 12, end: 14 }),
    Object.freeze({ start: 17, end: 20 }),
  ]),
});

const OPEN_METEO_BASE_URL =
  process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1/forecast';

const OSRM_BASE_URL =
  process.env.OSRM_BASE_URL || 'https://router.project-osrm.org/route/v1/driving';

const PRODUCT_SELECT_FIELDS =
  'name description price image tags discount rating restaurant category preparation_time';

module.exports = {
  ACTIVE_ORDER_STATUSES,
  KITCHEN_STATUSES,
  ONLINE_DRIVER_STATUSES,
  PAIR_ORDER_STATUSES,
  TIME_OF_DAY,
  WEATHER_CONDITION,
  ROUTING_SOURCE,
  WEATHER_SOURCE,
  TIME_TAGS,
  WEATHER_TAGS,
  SCORE,
  LIMITS,
  HOUR_WINDOWS,
  OPEN_METEO_BASE_URL,
  OSRM_BASE_URL,
  PRODUCT_SELECT_FIELDS,
};
