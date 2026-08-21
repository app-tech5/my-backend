
const MAX_PLAUSIBLE_DELIVERY_FEE = 20;
const MAX_DELIVERY_DISTANCE_KM = 50;
const DEFAULT_APP_DELIVERY_FEE = 2.5;

function toFiniteNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function parseGeoCoordinate(value) {
  if (value == null || value === "") return NaN;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : NaN;
}

function isUsableGeoCoordinate(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;
  return true;
}

function getDistanceKmFromLatLon(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(lat1 * Math.PI / 180) *
  Math.cos(lat2 * Math.PI / 180) *
  Math.sin(dLon / 2) *
  Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeUserLocation(loc) {
  if (!loc) return null;
  const lat = parseGeoCoordinate(loc.latitude ?? loc.lat);
  const lon = parseGeoCoordinate(loc.longitude ?? loc.lng);
  if (!isUsableGeoCoordinate(lat, lon)) return null;
  return { latitude: lat, longitude: lon };
}

function getDistanceKmBetweenUserAndRestaurant(restaurant, userLocation) {
  const user = normalizeUserLocation(userLocation);
  const restLat = parseGeoCoordinate(restaurant?.latitude);
  const restLon = parseGeoCoordinate(restaurant?.longitude);

  if (!user || !isUsableGeoCoordinate(restLat, restLon)) {
    return null;
  }

  const distance = getDistanceKmFromLatLon(
    user.latitude,
    user.longitude,
    restLat,
    restLon
  );

  if (!Number.isFinite(distance) || distance > MAX_DELIVERY_DISTANCE_KM) {
    return null;
  }

  return Math.round(distance * 10) / 10;
}

function calculateDeliveryFeeFromSetting(setting, distanceKm, defaultFee = DEFAULT_APP_DELIVERY_FEE) {
  if (!setting) {
    return Number(defaultFee.toFixed(2));
  }

  const {
    freeDeliveryEnabled,
    deliveryFeeType,
    fixedDeliveryFee,
    dynamicDeliveryFee,
    maxDeliveryDistance,
    isDeliveryEnabled
  } = setting;

  if (isDeliveryEnabled === false) {
    return 0;
  }

  if (deliveryFeeType === "FREE" || freeDeliveryEnabled) {
    return 0;
  }

  if (
  distanceKm != null &&
  Number.isFinite(Number(maxDeliveryDistance)) &&
  distanceKm > Number(maxDeliveryDistance))
  {
    return Number(toFiniteNumber(fixedDeliveryFee, defaultFee).toFixed(2));
  }

  if (
  ["DYNAMIC", "RESTAURANT_DEFINED"].includes(deliveryFeeType) &&
  distanceKm != null)
  {
    const dyn = dynamicDeliveryFee || {};
    const baseFee = toFiniteNumber(dyn.baseFee, NaN);
    const perKmFee = toFiniteNumber(dyn.perKmFee, NaN);
    const minFee = toFiniteNumber(dyn.minFee, 1.5);
    const maxFee = toFiniteNumber(dyn.maxFee, 10);

    if (!Number.isFinite(baseFee) || !Number.isFinite(perKmFee)) {
      return Number(toFiniteNumber(fixedDeliveryFee, defaultFee).toFixed(2));
    }

    let fee = baseFee + distanceKm * perKmFee;
    fee = Math.max(fee, minFee);
    fee = Math.min(fee, maxFee);
    return Number(fee.toFixed(2));
  }

  return Number(toFiniteNumber(fixedDeliveryFee, defaultFee).toFixed(2));
}

function resolveDeliveryFee(order, deliverySetting, restaurant, user, appDefaultFee = DEFAULT_APP_DELIVERY_FEE) {
  if (order?.delivery?.type === "pickup") {
    return 0;
  }

  const subtotal = toFiniteNumber(order?.subtotal, 0);
  const setting = deliverySetting || {};
  const threshold = toFiniteNumber(setting.freeDeliveryThreshold, 25);

  if (subtotal >= threshold) {
    return 0;
  }

  const distanceKm = getDistanceKmBetweenUserAndRestaurant(restaurant, user?.location);
  return calculateDeliveryFeeFromSetting(setting, distanceKm, appDefaultFee);
}

function needsDeliveryFeeFix(order, resolvedFee) {
  const current = toFiniteNumber(order?.delivery?.deliveryFee, 0);

  if (Math.abs(current - resolvedFee) <= 0.01) {
    return false;
  }

  if (order?.delivery?.type === "pickup" && current > 0) {
    return true;
  }

  if (current > MAX_PLAUSIBLE_DELIVERY_FEE) {
    return true;
  }

  if (resolvedFee === 0 && current > 0) {
    return true;
  }

  return false;
}

function recalculateOrderTotals(order, deliveryFee) {
  const subtotal = toFiniteNumber(order?.subtotal, 0);
  const taxRate = toFiniteNumber(order?.tax?.rate, 0);
  const taxAmount = taxRate * subtotal;
  const totalPrice = subtotal + taxAmount + deliveryFee;

  return { subtotal, taxAmount, deliveryFee, totalPrice };
}

module.exports = {
  MAX_PLAUSIBLE_DELIVERY_FEE,
  toFiniteNumber,
  getDistanceKmFromLatLon,
  getDistanceKmBetweenUserAndRestaurant,
  calculateDeliveryFeeFromSetting,
  resolveDeliveryFee,
  needsDeliveryFeeFix,
  recalculateOrderTotals,

  async up(db) {
    const ordersCol = db.collection("orders");
    const restaurantsCol = db.collection("restaurants");
    const usersCol = db.collection("users");
    const deliverySettingsCol = db.collection("deliverysettings");
    const appSettingsCol = db.collection("appsettings");

    const appSettings = await appSettingsCol.findOne({});
    const appDefaultFee = toFiniteNumber(appSettings?.deliveryFee, DEFAULT_APP_DELIVERY_FEE);

    const deliverySettings = await deliverySettingsCol.find({}).toArray();
    const deliverySettingByRestaurant = new Map(
      deliverySettings.map((setting) => [String(setting.restaurant), setting])
    );

    const orders = await ordersCol.find({}).toArray();

    for (const order of orders) {
      const restaurant = await restaurantsCol.findOne({ _id: order.restaurant });
      const user = await usersCol.findOne(
        { _id: order.user },
        { projection: { location: 1 } }
      );
      const deliverySetting = deliverySettingByRestaurant.get(String(order.restaurant));

      const resolvedFee = resolveDeliveryFee(
        order,
        deliverySetting,
        restaurant,
        user,
        appDefaultFee
      );

      if (!needsDeliveryFeeFix(order, resolvedFee)) {
        continue;
      }

      const { subtotal, taxAmount, deliveryFee, totalPrice } = recalculateOrderTotals(
        order,
        resolvedFee
      );

      await ordersCol.updateOne(
        { _id: order._id },
        {
          $set: {
            subtotal,
            "tax.amount": taxAmount,
            "delivery.deliveryFee": deliveryFee,
            totalPrice,
            updatedAt: new Date()
          }
        }
      );
    }
  },

  async down() {

  }
};
