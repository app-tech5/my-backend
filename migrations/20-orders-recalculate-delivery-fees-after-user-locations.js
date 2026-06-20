/**
 * Recalcule `delivery.deliveryFee` (et totaux) pour les commandes delivery
 * dont le client a maintenant une `location` valide (après migration 19).
 *
 * Corrige les fees figés au `fixedDeliveryFee` quand la migration 16 n'avait
 * pas pu calculer la distance.
 *
 * Logique fee : même règles que migration 16 (app client, promos incluses).
 */

const {
  toFiniteNumber,
  resolveDeliveryFee,
  recalculateOrderTotals,
} = require('./16-orders-fix-absurd-delivery-fees');

const { hasValidLocation } = require('./19-users-backfill-paris-locations');

const BACKUP_COLLECTION = '_migration_20_order_delivery_fee_backups';

function shouldRecalculateDeliveryFee(order, user, resolvedFee) {
  if (order?.delivery?.type !== 'delivery') {
    return false;
  }

  if (!hasValidLocation(user)) {
    return false;
  }

  const current = toFiniteNumber(order?.delivery?.deliveryFee, 0);
  return Math.abs(current - resolvedFee) > 0.01;
}

async function up(db) {
  const ordersCol = db.collection('orders');
  const restaurantsCol = db.collection('restaurants');
  const usersCol = db.collection('users');
  const deliverySettingsCol = db.collection('deliverysettings');
  const appSettingsCol = db.collection('appsettings');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const appSettings = await appSettingsCol.findOne({});
  const appDefaultFee = toFiniteNumber(appSettings?.deliveryFee, 2.5);

  const deliverySettings = await deliverySettingsCol.find({}).toArray();
  const deliverySettingByRestaurant = new Map(
    deliverySettings.map((setting) => [String(setting.restaurant), setting])
  );

  const orders = await ordersCol
    .find({ 'delivery.type': 'delivery' })
    .toArray();

  let updatedCount = 0;

  for (const order of orders) {
    const user = await usersCol.findOne(
      { _id: order.user },
      { projection: { location: 1 } }
    );

    if (!hasValidLocation(user)) {
      continue;
    }

    const restaurant = await restaurantsCol.findOne({ _id: order.restaurant });
    const deliverySetting = deliverySettingByRestaurant.get(String(order.restaurant));

    const resolvedFee = resolveDeliveryFee(
      order,
      deliverySetting,
      restaurant,
      user,
      appDefaultFee
    );

    if (!shouldRecalculateDeliveryFee(order, user, resolvedFee)) {
      continue;
    }

    const { subtotal, taxAmount, deliveryFee, totalPrice } = recalculateOrderTotals(
      order,
      resolvedFee
    );

    await backupCol.updateOne(
      { orderId: order._id },
      {
        $set: {
          orderId: order._id,
          previous: {
            subtotal: order.subtotal,
            taxAmount: order.tax?.amount,
            deliveryFee: order.delivery?.deliveryFee,
            totalPrice: order.totalPrice,
          },
          migratedAt: new Date(),
        },
      },
      { upsert: true }
    );

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: {
          subtotal,
          'tax.amount': taxAmount,
          'delivery.deliveryFee': deliveryFee,
          totalPrice,
          updatedAt: new Date(),
        },
      }
    );

    updatedCount += 1;
  }

  console.log(`✅ ${updatedCount} commande(s) delivery fee recalculée(s)`);
}

async function down(db) {
  const ordersCol = db.collection('orders');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const backups = await backupCol.find({}).toArray();

  for (const backup of backups) {
    await ordersCol.updateOne(
      { _id: backup.orderId },
      {
        $set: {
          subtotal: backup.previous.subtotal,
          'tax.amount': backup.previous.taxAmount,
          'delivery.deliveryFee': backup.previous.deliveryFee,
          totalPrice: backup.previous.totalPrice,
          updatedAt: new Date(),
        },
      }
    );
  }

  await backupCol.deleteMany({});
  console.log(`↩️ ${backups.length} commande(s) restaurée(s)`);
}

module.exports = {
  BACKUP_COLLECTION,
  shouldRecalculateDeliveryFee,
  up,
  down,
};
