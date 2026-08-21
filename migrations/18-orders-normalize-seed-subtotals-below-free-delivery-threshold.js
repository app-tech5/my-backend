
const { ObjectId } = require("mongodb");
const {
  toFiniteNumber,
  resolveDeliveryFee,
  recalculateOrderTotals
} = require("./16-orders-fix-absurd-delivery-fees");

const SEED_ORDER_MAX_ID = new ObjectId("697a00000000000000000000");
const REALISTIC_SUBTOTAL_CAP = 22;
const MIN_SUBTOTAL = 5;
const DEFAULT_APP_DELIVERY_FEE = 2.5;

function round2(value) {
  return Math.round(value * 100) / 100;
}

function getTargetSubtotal(subtotal, threshold) {
  const belowThreshold = Math.max(MIN_SUBTOTAL, threshold - 2);
  return Math.min(subtotal, belowThreshold, REALISTIC_SUBTOTAL_CAP);
}

function scaleItemsToSubtotal(items, targetSubtotal) {
  const rawItems = Array.isArray(items) ? items : [];
  const currentSubtotal = rawItems.reduce(
    (sum, item) => sum + toFiniteNumber(item?.total, 0),
    0
  );

  if (currentSubtotal <= 0 || currentSubtotal <= targetSubtotal) {
    return rawItems;
  }

  const factor = targetSubtotal / currentSubtotal;

  const scaledItems = rawItems.map((item) => {
    const quantity = Math.max(1, toFiniteNumber(item?.quantity, 1));
    const newTotal = round2(toFiniteNumber(item?.total, 0) * factor);
    const extras = Array.isArray(item?.extras) ?
    item.extras.map((extra) => ({
      ...extra,
      price: round2(toFiniteNumber(extra?.price, 0) * factor)
    })) :
    [];

    return {
      ...item,
      price: round2(newTotal / quantity),
      quantity,
      extras,
      total: newTotal
    };
  });

  const scaledSubtotal = scaledItems.reduce(
    (sum, item) => sum + toFiniteNumber(item.total, 0),
    0
  );
  const drift = round2(targetSubtotal - scaledSubtotal);

  if (drift !== 0 && scaledItems.length > 0) {
    const lastItem = scaledItems[scaledItems.length - 1];
    const adjustedTotal = round2(toFiniteNumber(lastItem.total, 0) + drift);
    const adjustedQty = Math.max(1, toFiniteNumber(lastItem.quantity, 1));
    scaledItems[scaledItems.length - 1] = {
      ...lastItem,
      total: adjustedTotal,
      price: round2(adjustedTotal / adjustedQty)
    };
  }

  return scaledItems;
}

function shouldNormalizeSeedOrder(order, threshold) {
  if (order?.delivery?.type !== "delivery") {
    return false;
  }

  const subtotal = toFiniteNumber(order?.subtotal, 0);
  return subtotal >= threshold;
}

module.exports = {
  SEED_ORDER_MAX_ID,
  REALISTIC_SUBTOTAL_CAP,
  getTargetSubtotal,
  scaleItemsToSubtotal,
  shouldNormalizeSeedOrder,

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

    const seedOrders = await ordersCol.
    find({
      _id: { $lt: SEED_ORDER_MAX_ID },
      "delivery.type": "delivery"
    }).
    toArray();

    for (const order of seedOrders) {
      const deliverySetting = deliverySettingByRestaurant.get(String(order.restaurant));
      const threshold = toFiniteNumber(deliverySetting?.freeDeliveryThreshold, 25);

      if (!shouldNormalizeSeedOrder(order, threshold)) {
        continue;
      }

      const targetSubtotal = getTargetSubtotal(toFiniteNumber(order.subtotal, 0), threshold);
      const normalizedItems = scaleItemsToSubtotal(order.items, targetSubtotal);
      const subtotal = normalizedItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.total, 0),
        0
      );

      const restaurant = await restaurantsCol.findOne({ _id: order.restaurant });
      const user = await usersCol.findOne(
        { _id: order.user },
        { projection: { location: 1 } }
      );

      const orderForFee = {
        ...order,
        subtotal,
        items: normalizedItems
      };

      const deliveryFee = resolveDeliveryFee(
        orderForFee,
        deliverySetting,
        restaurant,
        user,
        appDefaultFee
      );

      const { taxAmount, totalPrice } = recalculateOrderTotals(orderForFee, deliveryFee);

      await ordersCol.updateOne(
        { _id: order._id },
        {
          $set: {
            items: normalizedItems,
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
