/**
 * Données marketing admin dashboard — histogramme Jan–Jul avec Sell / Commission variés.
 * Répartit des commandes existantes (user + restaurant valides) sur 7 mois,
 * recalcule subtotal / tax / delivery / totalPrice de façon cohérente.
 *
 * up   → dates + montants (idempotent via migrationSeedKey)
 * down → restaure l'état sauvegardé
 */

const { ObjectId } = require("mongodb");
const {
  toFiniteNumber,
  resolveDeliveryFee,
  recalculateOrderTotals,
} = require("./16-orders-fix-absurd-delivery-fees");
const { scaleItemsToSubtotal } = require("./18-orders-normalize-seed-subtotals-below-free-delivery-threshold");

const SEED_KEY = "migration_29_admin_dashboard_histogram";
const MARKETING_YEAR = 2026;
const ORDERS_PER_MONTH = 6;

const MONTH_TARGETS = [
  { month: 0, gross: 1400, net: 580 },
  { month: 1, gross: 3600, net: 1450 },
  { month: 2, gross: 2100, net: 850 },
  { month: 3, gross: 900, net: 380 },
  { month: 4, gross: 2600, net: 1050 },
  { month: 5, gross: 1200, net: 490 },
  { month: 6, gross: 3000, net: 1220 },
];

function round2(value) {
  return Math.round(value * 100) / 100;
}

function monthDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12, 30, 0, 0);
}

function isEligibleOrder(order) {
  return (
    order?.user &&
    order?.restaurant &&
    Array.isArray(order?.items) &&
    order.items.length > 0 &&
    toFiniteNumber(order?.subtotal, 0) > 0 &&
    toFiniteNumber(order?.totalPrice, 0) > 0
  );
}

function targetSubtotalFromTotal(order, targetTotal) {
  const currentTotal = toFiniteNumber(order?.totalPrice, 0);
  const currentSubtotal = toFiniteNumber(order?.subtotal, 0);
  if (currentTotal <= 0) return currentSubtotal;
  return round2((targetTotal * currentSubtotal) / currentTotal);
}

async function buildOrderContext(db) {
  const restaurantsCol = db.collection("restaurants");
  const usersCol = db.collection("users");
  const deliverySettingsCol = db.collection("deliverysettings");
  const appSettingsCol = db.collection("appsettings");

  const appSettings = await appSettingsCol.findOne({});
  const appDefaultFee = toFiniteNumber(appSettings?.deliveryFee, 2.5);
  const deliverySettings = await deliverySettingsCol.find({}).toArray();
  const deliverySettingByRestaurant = new Map(
    deliverySettings.map((setting) => [String(setting.restaurant), setting])
  );

  const restaurantCache = new Map();
  const userCache = new Map();

  const getRestaurant = async (id) => {
    const key = String(id);
    if (!restaurantCache.has(key)) {
      restaurantCache.set(key, await restaurantsCol.findOne({ _id: id }));
    }
    return restaurantCache.get(key);
  };

  const getUser = async (id) => {
    const key = String(id);
    if (!userCache.has(key)) {
      userCache.set(key, await usersCol.findOne({ _id: id }, { projection: { location: 1 } }));
    }
    return userCache.get(key);
  };

  return {
    appDefaultFee,
    deliverySettingByRestaurant,
    getRestaurant,
    getUser,
  };
}

async function scaleOrderToTarget(db, order, targetTotal, context) {
  const targetSubtotal = targetSubtotalFromTotal(order, targetTotal);
  const normalizedItems = scaleItemsToSubtotal(order.items, targetSubtotal);
  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + toFiniteNumber(item.total, 0),
    0
  );

  const restaurant = await context.getRestaurant(order.restaurant);
  const user = await context.getUser(order.user);
  const deliverySetting = context.deliverySettingByRestaurant.get(String(order.restaurant));

  const orderForFee = { ...order, subtotal, items: normalizedItems };
  const deliveryFee = resolveDeliveryFee(
    orderForFee,
    deliverySetting,
    restaurant,
    user,
    context.appDefaultFee
  );
  const { taxAmount, totalPrice } = recalculateOrderTotals(orderForFee, deliveryFee);

  return {
    items: normalizedItems,
    subtotal,
    taxAmount,
    deliveryFee,
    totalPrice,
  };
}

function splitMonthTargets(target) {
  const grossGap = round2(target.gross - target.net);
  const deliveredCount = 4;
  const cancelledCount = 2;
  const perDelivered = round2(target.net / deliveredCount);
  const perCancelled = round2(grossGap / cancelledCount);

  return [
    ...Array.from({ length: deliveredCount }, () => ({
      status: "delivered",
      targetTotal: perDelivered,
    })),
    ...Array.from({ length: cancelledCount }, () => ({
      status: "cancelled",
      targetTotal: perCancelled,
    })),
  ];
}

async function up(db) {
  const ordersCol = db.collection("orders");
  const expectedCount = MONTH_TARGETS.length * 6;

  const alreadyDone = await ordersCol.countDocuments({ migrationSeedKey: SEED_KEY });
  if (alreadyDone >= expectedCount) {
    console.log("✅ Migration 29 déjà appliquée");
    return;
  }

  const context = await buildOrderContext(db);

  const pool = await ordersCol
    .find({
      migrationSeedKey: { $ne: SEED_KEY },
      status: { $in: ["delivered", "cancelled", "pending", "preparing"] },
    })
    .sort({ _id: 1 })
    .toArray();

  const eligible = pool.filter(isEligibleOrder);
  if (eligible.length < expectedCount) {
    console.log(
      `⚠️ ${eligible.length} commandes éligibles sur ${expectedCount} requises — migration partielle`
    );
  }
  if (!eligible.length) {
    console.log("⚠️ Aucune commande éligible — migration 29 ignorée");
    return;
  }

  let orderIndex = 0;
  let updated = 0;

  for (let monthIndex = 0; monthIndex < MONTH_TARGETS.length; monthIndex += 1) {
    const target = MONTH_TARGETS[monthIndex];
    const assignments = splitMonthTargets(target);

    for (let slot = 0; slot < assignments.length; slot += 1) {
      if (orderIndex >= eligible.length) break;

      const assignment = assignments[slot];
      const order = eligible[orderIndex];
      orderIndex += 1;

      const createdAt = monthDate(MARKETING_YEAR, target.month, 3 + slot * 4);
      const scaled = await scaleOrderToTarget(db, order, assignment.targetTotal, context);

      await ordersCol.updateOne(
        { _id: order._id },
        {
          $set: {
            status: assignment.status,
            items: scaled.items,
            subtotal: scaled.subtotal,
            "tax.amount": scaled.taxAmount,
            "delivery.deliveryFee": scaled.deliveryFee,
            totalPrice: scaled.totalPrice,
            createdAt,
            updatedAt: createdAt,
            migrationSeedKey: SEED_KEY,
            migrationSeedPreviousStatus: order.status,
            migrationSeedPreviousCreatedAt: order.createdAt,
            migrationSeedPreviousUpdatedAt: order.updatedAt,
            migrationSeedPreviousItems: order.items,
            migrationSeedPreviousSubtotal: order.subtotal,
            migrationSeedPreviousTaxAmount: order.tax?.amount,
            migrationSeedPreviousDeliveryFee: order.delivery?.deliveryFee,
            migrationSeedPreviousTotalPrice: order.totalPrice,
          },
        }
      );
      updated += 1;
    }
  }

  console.log(`✅ Migration 29 : ${updated} commandes réparties Jan–Jul ${MARKETING_YEAR}`);
}

async function down(db) {
  const ordersCol = db.collection("orders");
  const touched = await ordersCol.find({ migrationSeedKey: SEED_KEY }).toArray();

  for (const order of touched) {
    const $set = {
      status: order.migrationSeedPreviousStatus ?? order.status,
      items: order.migrationSeedPreviousItems ?? order.items,
      subtotal: order.migrationSeedPreviousSubtotal ?? order.subtotal,
      "tax.amount": order.migrationSeedPreviousTaxAmount ?? order.tax?.amount,
      "delivery.deliveryFee": order.migrationSeedPreviousDeliveryFee ?? order.delivery?.deliveryFee,
      totalPrice: order.migrationSeedPreviousTotalPrice ?? order.totalPrice,
      createdAt: order.migrationSeedPreviousCreatedAt ?? order.createdAt,
      updatedAt: order.migrationSeedPreviousUpdatedAt ?? order.updatedAt,
    };

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set,
        $unset: {
          migrationSeedKey: "",
          migrationSeedPreviousStatus: "",
          migrationSeedPreviousCreatedAt: "",
          migrationSeedPreviousUpdatedAt: "",
          migrationSeedPreviousItems: "",
          migrationSeedPreviousSubtotal: "",
          migrationSeedPreviousTaxAmount: "",
          migrationSeedPreviousDeliveryFee: "",
          migrationSeedPreviousTotalPrice: "",
        },
      }
    );
  }

  console.log(`↩️ Migration 29 : ${touched.length} commandes restaurées`);
}

module.exports = {
  SEED_KEY,
  MARKETING_YEAR,
  MONTH_TARGETS,
  ORDERS_PER_MONTH,
  round2,
  isEligibleOrder,
  splitMonthTargets,
  targetSubtotalFromTotal,
  up,
  down,
};
