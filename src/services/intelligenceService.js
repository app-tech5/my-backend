
const Order = require('../models/Order');
const Product = require('../models/Product');
const Driver = require('../models/Driver');
const DeliverySetting = require('../models/DeliverySetting');
const Restaurant = require('../models/Restaurant');
const i18n = require('../config/i18n');
const {
  applyRecommendationProvider,
  applyEtaProvider,
  applySurgeProvider
} = require('./ai/recommendationProviders');
const {
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
  PRODUCT_SELECT_FIELDS
} = require('../constants/intelligence');

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
  Math.sin(dLat / 2) ** 2 +
  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inHourWindow(h, window) {
  return h >= window.start && h < window.end;
}

function hourBucket(date = new Date()) {
  const h = date.getHours();
  if (inHourWindow(h, HOUR_WINDOWS.BREAKFAST)) return TIME_OF_DAY.BREAKFAST;
  if (inHourWindow(h, HOUR_WINDOWS.LUNCH)) return TIME_OF_DAY.LUNCH;
  if (inHourWindow(h, HOUR_WINDOWS.SNACK)) return TIME_OF_DAY.SNACK;
  if (inHourWindow(h, HOUR_WINDOWS.DINNER)) return TIME_OF_DAY.DINNER;
  return TIME_OF_DAY.LATE;
}

function isRushHour(date = new Date()) {
  const h = date.getHours();
  return HOUR_WINDOWS.RUSH.some((window) => inHourWindow(h, window));
}

function weatherFallback() {
  return {
    source: WEATHER_SOURCE.HEURISTIC,
    condition: WEATHER_CONDITION.FAIR,
    temperatureC: LIMITS.DEFAULT_TEMP_C,
    precipitationMm: 0
  };
}

function classifyWeather(temp, precip, code) {
  if (precip >= LIMITS.WEATHER_RAIN_PRECIP_MM || code >= LIMITS.WEATHER_RAIN_CODE_MIN) {
    return WEATHER_CONDITION.RAIN;
  }
  if (temp >= LIMITS.WEATHER_HOT_C) return WEATHER_CONDITION.HOT;
  if (temp <= LIMITS.WEATHER_COLD_C) return WEATHER_CONDITION.COLD;
  return WEATHER_CONDITION.FAIR;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.HTTP_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWeather(lat, lng) {
  const fallback = weatherFallback();
  if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return fallback;
  }
  try {
    const url =
    `${OPEN_METEO_BASE_URL}?latitude=${Number(lat)}&longitude=${Number(lng)}` +
    `&current=temperature_2m,precipitation,weather_code&timezone=auto`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    const current = data.current || {};
    const temp = toNum(current.temperature_2m, LIMITS.DEFAULT_TEMP_C);
    const precip = toNum(current.precipitation, 0);
    const code = toNum(current.weather_code, 0);
    return {
      source: WEATHER_SOURCE.OPEN_METEO,
      condition: classifyWeather(temp, precip, code),
      temperatureC: temp,
      precipitationMm: precip,
      weatherCode: code
    };
  } catch {
    return fallback;
  }
}

async function getDeliverySettingForRestaurant(restaurantId) {
  if (!restaurantId) return null;
  return DeliverySetting.findOne({ restaurant: restaurantId }).lean();
}

function scoreProduct(product, { cartIds, pairScores, timeTags, weatherTags }) {
  const id = String(product._id);
  if (cartIds.has(id)) return -Infinity;

  let score = 0;
  score += toNum(pairScores.get(id), 0) * SCORE.PAIR_WEIGHT;
  score += toNum(product?.rating?.average, 0) * SCORE.RATING_WEIGHT;
  if (toNum(product?.rating?.count, 0) > SCORE.RATING_COUNT_THRESHOLD) {
    score += SCORE.RATING_COUNT_BONUS;
  }

  const tags = (product.tags || []).map((t) => String(t).toLowerCase());
  const name = String(product.name || '').toLowerCase();
  for (const t of timeTags) {
    if (tags.includes(t) || name.includes(t)) score += SCORE.TIME_TAG_BONUS;
  }
  for (const t of weatherTags) {
    if (tags.includes(t) || name.includes(t)) score += SCORE.WEATHER_TAG_BONUS;
  }
  if (product.discount?.isActive) score += SCORE.DISCOUNT_BONUS;
  return score;
}

async function buildPairScores(restaurantId, cartProductIds) {
  const pairScores = new Map();
  if (!restaurantId) return pairScores;

  const recent = await Order.find({
    restaurant: restaurantId,
    status: { $in: [...PAIR_ORDER_STATUSES] }
  }).
  select('items').
  sort({ createdAt: -1 }).
  limit(LIMITS.RECENT_ORDERS_FOR_PAIRS).
  lean();

  const cartSet = new Set((cartProductIds || []).map(String));
  for (const order of recent) {
    const ids = [
    ...new Set((order.items || []).map((it) => String(it.item)).filter(Boolean))];

    if (ids.length < 2 && cartSet.size === 0) continue;
    for (const a of ids) {
      for (const b of ids) {
        if (a === b) continue;
        if (cartSet.size && !cartSet.has(a)) continue;
        pairScores.set(b, toNum(pairScores.get(b), 0) + 1);
      }
    }
  }
  return pairScores;
}

function buildRecoReason(product, { bucket, weather, pairScores }) {
  const id = String(product._id);
  if (toNum(pairScores.get(id), 0) > 0) {
    return i18n.__('intelligence_reco_often_together');
  }
  if (weather.condition === WEATHER_CONDITION.RAIN) {
    return i18n.__('intelligence_reco_rain');
  }
  if (weather.condition === WEATHER_CONDITION.HOT) {
    return i18n.__('intelligence_reco_hot');
  }
  if (weather.condition === WEATHER_CONDITION.COLD) {
    return i18n.__('intelligence_reco_cold');
  }
  if (bucket === TIME_OF_DAY.BREAKFAST) {
    return i18n.__('intelligence_reco_breakfast');
  }
  if (bucket === TIME_OF_DAY.DINNER) {
    return i18n.__('intelligence_reco_dinner');
  }
  return i18n.__('intelligence_reco_default');
}

function clampRecoLimit(limit) {
  const n = toNum(limit, LIMITS.DEFAULT_RECO_LIMIT);
  return Math.max(LIMITS.MIN_RECO_LIMIT, Math.min(n, LIMITS.MAX_RECO_LIMIT));
}

async function getRecommendations({
  restaurantId,
  productIds = [],
  lat,
  lng,
  limit = LIMITS.DEFAULT_RECO_LIMIT,
  userId
}) {
  const weather = await fetchWeather(lat, lng);
  const bucket = hourBucket();
  const timeTags = TIME_TAGS[bucket] || TIME_TAGS[TIME_OF_DAY.LUNCH];
  const weatherTags = WEATHER_TAGS[weather.condition] || WEATHER_TAGS[WEATHER_CONDITION.FAIR];

  let historyIds = [];
  if (userId) {
    const history = await Order.find({ user: userId, status: 'delivered' }).
    select('items').
    sort({ createdAt: -1 }).
    limit(LIMITS.USER_HISTORY_ORDERS).
    lean();
    historyIds = history.flatMap((o) => (o.items || []).map((it) => String(it.item)));
  }

  const cartIds = new Set([
  ...productIds.map(String),
  ...historyIds.slice(0, LIMITS.USER_HISTORY_IDS)]
  );
  const pairScores = await buildPairScores(restaurantId, [...cartIds]);

  const query = { availability: true };
  if (restaurantId) query.restaurant = restaurantId;

  const products = await Product.find(query).
  select(PRODUCT_SELECT_FIELDS).
  limit(LIMITS.PRODUCT_CANDIDATES).
  lean();

  const ranked = products.
  map((p) => ({
    product: p,
    score: scoreProduct(p, { cartIds, pairScores, timeTags, weatherTags })
  })).
  filter((r) => Number.isFinite(r.score) && r.score > -Infinity).
  sort((a, b) => b.score - a.score).
  slice(0, clampRecoLimit(limit));

  const builtinItems = ranked.map((r) => ({
    ...r.product,
    recommendationScore: Number(r.score.toFixed(2)),
    reason: buildRecoReason(r.product, { bucket, weather, pairScores })
  }));

  const providerResult = await applyRecommendationProvider({
    candidates: ranked.map((r) => r.product),
    builtinItems,
    restaurantId,
    productIds,
    historyIds,
    weather,
    bucket,
    limit: clampRecoLimit(limit)
  });

  const items = providerResult.items.map((item) => {
    const { aiReason, ...rest } = item;
    return {
      ...rest,

      reason:
      typeof aiReason === 'string' && aiReason ?
      aiReason :
      item.reason || buildRecoReason(item, { bucket, weather, pairScores })
    };
  });

  return {
    items,
    context: {
      timeOfDay: bucket,
      weather,
      basedOnCart: productIds.length > 0,
      basedOnHistory: historyIds.length > 0,
      recommendationProvider: providerResult.provider,
      recommendationMode: providerResult.mode,
      recommendationModel: providerResult.model || null,
      recommendationFallbackError: providerResult.fallbackError || null
    }
  };
}

async function fetchRouteDurationMinutes(fromLat, fromLng, toLat, toLng) {
  try {
    const url =
    `${OSRM_BASE_URL}/` +
    `${Number(fromLng)},${Number(fromLat)};${Number(toLng)},${Number(toLat)}` +
    `?overview=false`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = await res.json();
    const seconds = data?.routes?.[0]?.duration;
    if (!Number.isFinite(Number(seconds))) return null;
    return Math.max(LIMITS.MIN_ROUTE_MINUTES, Math.round(Number(seconds) / 60));
  } catch {
    return null;
  }
}

function weatherExtraMinutes(condition) {
  if (condition === WEATHER_CONDITION.RAIN) return LIMITS.WEATHER_RAIN_EXTRA_MINUTES;
  if (condition === WEATHER_CONDITION.COLD) return LIMITS.WEATHER_COLD_EXTRA_MINUTES;
  return 0;
}

async function getSmartEta({ restaurantId, lat, lng }) {
  const setting = await getDeliverySettingForRestaurant(restaurantId);
  const restaurant = restaurantId ?
  await Restaurant.findById(restaurantId).select('latitude longitude name').lean() :
  null;

  const basePrep = toNum(setting?.deliveryPreparationTime, LIMITS.DEFAULT_PREP_MINUTES);
  const kitchenLoad = restaurantId ?
  await Order.countDocuments({
    restaurant: restaurantId,
    status: { $in: [...KITCHEN_STATUSES] }
  }) :
  0;

  const kitchenExtra = Math.min(
    LIMITS.MAX_KITCHEN_EXTRA_MINUTES,
    kitchenLoad * LIMITS.KITCHEN_MINUTES_PER_ORDER
  );

  let distanceKm = null;
  let routeMinutes = null;
  if (
  restaurant &&
  lat != null &&
  lng != null &&
  restaurant.latitude != null &&
  restaurant.longitude != null)
  {
    distanceKm = haversineKm(
      toNum(lat),
      toNum(lng),
      toNum(restaurant.latitude),
      toNum(restaurant.longitude)
    );
    routeMinutes = await fetchRouteDurationMinutes(
      toNum(restaurant.latitude),
      toNum(restaurant.longitude),
      toNum(lat),
      toNum(lng)
    );
  }

  const rush = isRushHour();
  const travelMinPerKm = rush ?
  LIMITS.RUSH_TRAVEL_MIN_PER_KM :
  LIMITS.NORMAL_TRAVEL_MIN_PER_KM;
  const heuristicTravel =
  distanceKm != null ?
  Math.max(LIMITS.MIN_TRAVEL_MINUTES, Math.round(distanceKm * travelMinPerKm)) :
  LIMITS.FALLBACK_TRAVEL_MINUTES;

  let travelMinutes = routeMinutes != null ? routeMinutes : heuristicTravel;
  if (routeMinutes != null && rush) {
    travelMinutes = Math.round(routeMinutes * LIMITS.RUSH_ROUTE_MULTIPLIER);
  }

  const weather = await fetchWeather(lat, lng);
  const weatherExtra = weatherExtraMinutes(weather.condition);

  const minMinutes = Math.max(
    LIMITS.MIN_ETA_MINUTES,
    Math.round(
      basePrep * LIMITS.PREP_MIN_FACTOR +
      kitchenExtra * LIMITS.KITCHEN_MIN_FACTOR +
      travelMinutes * LIMITS.TRAVEL_MIN_FACTOR
    )
  );
  const maxMinutes = Math.max(
    minMinutes + LIMITS.ETA_RANGE_PADDING,
    Math.round(basePrep + kitchenExtra + travelMinutes + weatherExtra)
  );

  const builtinResult = {
    minMinutes,
    maxMinutes,
    label: i18n.__('intelligence_eta_label', String(minMinutes), String(maxMinutes)),
    estimatedArrivalAt: new Date(Date.now() + maxMinutes * 60 * 1000).toISOString(),
    factors: {
      basePrepMinutes: basePrep,
      kitchenOrdersInProgress: kitchenLoad,
      kitchenExtraMinutes: kitchenExtra,
      distanceKm: distanceKm != null ? Number(distanceKm.toFixed(2)) : null,
      travelMinutes,
      routingSource: routeMinutes != null ? ROUTING_SOURCE.OSRM : ROUTING_SOURCE.HEURISTIC,
      rushHour: rush,
      weatherExtraMinutes: weatherExtra,
      weather
    }
  };
  const providerResult = await applyEtaProvider({ builtinResult });
  return {
    ...providerResult.eta,
    provider: providerResult.provider,
    providerMode: providerResult.mode,
    providerFallbackError: providerResult.fallbackError || null
  };
}

function computeDemandRatio(activeOrders, onlineDrivers) {
  if (onlineDrivers > 0) return activeOrders / onlineDrivers;
  if (activeOrders >= LIMITS.SURGE_NO_DRIVER_RATIO_ORDERS) return LIMITS.SURGE_NO_DRIVER_RATIO;
  return 1;
}

async function getSurgePricing({ restaurantId, lat, lng }) {
  const since = new Date(Date.now() - LIMITS.DEMAND_WINDOW_MS);
  const demandQuery = {
    status: { $in: [...ACTIVE_ORDER_STATUSES] },
    createdAt: { $gte: since }
  };
  if (restaurantId) demandQuery.restaurant = restaurantId;

  const [activeOrders, onlineDrivers, weather] = await Promise.all([
  Order.countDocuments(demandQuery),
  Driver.countDocuments({ status: { $in: [...ONLINE_DRIVER_STATUSES] } }),
  fetchWeather(lat, lng)]
  );

  const demandRatio = computeDemandRatio(activeOrders, onlineDrivers);
  let multiplier = 1;
  const reasons = [];

  const noDriversHighDemand =
  onlineDrivers === 0 && activeOrders >= LIMITS.SURGE_NO_DRIVER_HIGH_ORDERS;
  if (demandRatio >= LIMITS.SURGE_HIGH_DEMAND_RATIO || noDriversHighDemand) {
    multiplier += LIMITS.SURGE_HIGH_DEMAND_BONUS;
    reasons.push(i18n.__('intelligence_surge_high_demand'));
  } else if (demandRatio >= LIMITS.SURGE_ELEVATED_DEMAND_RATIO) {
    multiplier += LIMITS.SURGE_ELEVATED_DEMAND_BONUS;
    reasons.push(i18n.__('intelligence_surge_elevated_demand'));
  }

  if (onlineDrivers <= 1 && activeOrders >= 1) {
    multiplier += LIMITS.SURGE_LOW_DRIVERS_BONUS;
    reasons.push(i18n.__('intelligence_surge_limited_drivers'));
  }

  if (weather.condition === WEATHER_CONDITION.RAIN) {
    multiplier += LIMITS.SURGE_RAIN_BONUS;
    reasons.push(i18n.__('intelligence_surge_weather_rain'));
  } else if (
  weather.condition === WEATHER_CONDITION.COLD ||
  weather.condition === WEATHER_CONDITION.HOT)
  {
    multiplier += LIMITS.SURGE_EXTREME_WEATHER_BONUS;
    reasons.push(i18n.__('intelligence_surge_weather', weather.condition));
  }

  if (isRushHour()) {
    multiplier += LIMITS.SURGE_RUSH_BONUS;
    reasons.push(i18n.__('intelligence_surge_rush_hour'));
  }

  multiplier = Math.min(LIMITS.SURGE_MAX_MULTIPLIER, Number(multiplier.toFixed(2)));
  const active = multiplier > LIMITS.SURGE_ACTIVE_THRESHOLD;

  const builtinResult = {
    active,
    multiplier: active ? multiplier : 1,
    label: active ?
    i18n.__('intelligence_surge_fee', multiplier.toFixed(2)) :
    i18n.__('intelligence_surge_standard'),
    reasons: active ? reasons : [],
    factors: {
      activeOrdersLastHour: activeOrders,
      onlineDrivers,
      demandRatio: Number(demandRatio.toFixed(2)),
      weather,
      rushHour: isRushHour()
    }
  };
  const providerResult = await applySurgeProvider({ builtinResult });
  return {
    ...providerResult.surge,
    provider: providerResult.provider,
    providerMode: providerResult.mode,
    providerFallbackError: providerResult.fallbackError || null
  };
}

function computeBaseFee(setting, distanceKm, subtotal) {
  let baseFee = toNum(setting?.fixedDeliveryFee, LIMITS.DEFAULT_FIXED_FEE);

  if (setting?.deliveryFeeType === 'FREE' || setting?.freeDeliveryEnabled) {
    baseFee = 0;
  } else if (
  ['DYNAMIC', 'RESTAURANT_DEFINED'].includes(setting?.deliveryFeeType) &&
  distanceKm != null)
  {
    const dyn = setting.dynamicDeliveryFee || {};
    baseFee =
    toNum(dyn.baseFee, LIMITS.DEFAULT_DYNAMIC_BASE_FEE) +
    distanceKm * toNum(dyn.perKmFee, LIMITS.DEFAULT_DYNAMIC_PER_KM);
    baseFee = Math.min(
      toNum(dyn.maxFee, LIMITS.DEFAULT_DYNAMIC_MAX_FEE),
      Math.max(toNum(dyn.minFee, LIMITS.DEFAULT_DYNAMIC_MIN_FEE), baseFee)
    );
  }

  if (
  setting?.freeDeliveryThreshold != null &&
  toNum(subtotal) >= toNum(setting.freeDeliveryThreshold, Infinity))
  {
    baseFee = 0;
  }

  return baseFee;
}

async function getDeliveryQuote({
  restaurantId,
  lat,
  lng,
  subtotal = 0,
  productIds = [],
  userId
}) {
  const [setting, eta, surge, recommendations] = await Promise.all([
  getDeliverySettingForRestaurant(restaurantId),
  getSmartEta({ restaurantId, lat, lng }),
  getSurgePricing({ restaurantId, lat, lng }),
  getRecommendations({
    restaurantId,
    productIds,
    lat,
    lng,
    userId,
    limit: LIMITS.DEFAULT_RECO_LIMIT
  })]
  );

  const baseFee = computeBaseFee(setting, eta.factors.distanceKm, subtotal);
  const multiplier = surge.active ? surge.multiplier : 1;
  const deliveryFee = Number((baseFee * multiplier).toFixed(2));

  return {
    deliveryFee,
    baseFee: Number(baseFee.toFixed(2)),
    surge,
    eta,
    recommendations: recommendations.items,
    recommendationContext: recommendations.context,
    deliverySetting: setting ?
    {
      _id: setting._id,
      deliveryFeeType: setting.deliveryFeeType,
      fixedDeliveryFee: setting.fixedDeliveryFee,
      freeDeliveryThreshold: setting.freeDeliveryThreshold,
      deliveryPreparationTime: setting.deliveryPreparationTime
    } :
    null
  };
}

module.exports = {
  getRecommendations,
  getSmartEta,
  getSurgePricing,
  getDeliveryQuote,
  fetchWeather,
  haversineKm,
  hourBucket,
  isRushHour
};
