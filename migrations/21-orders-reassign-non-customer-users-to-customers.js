
const { ObjectId } = require('mongodb');
const {
  toFiniteNumber,
  resolveDeliveryFee,
  recalculateOrderTotals
} = require('./16-orders-fix-absurd-delivery-fees');
const { seededShuffle } = require('./19-users-backfill-paris-locations');

const BACKUP_COLLECTION = '_migration_21_order_user_reassign_backups';
const SHUFFLE_SEED = 20260619;

async function findOrdersWithNonCustomerUser(db) {
  return db.
  collection('orders').
  aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'user',
      foreignField: '_id',
      as: 'userDoc'
    }
  },
  { $unwind: '$userDoc' },
  { $match: { 'userDoc.role': { $ne: 'customer' } } }]
  ).
  toArray();
}

function buildCustomerAssignments(orders, customerIds, seed = SHUFFLE_SEED) {
  if (!customerIds.length) {
    throw new Error('Aucun customer disponible pour la réassignation');
  }

  const shuffledCustomers = seededShuffle(
    customerIds.map((id) => new ObjectId(id)),
    seed
  );
  const shuffledOrders = seededShuffle([...orders], seed + 1);

  return shuffledOrders.map((order, index) => ({
    order,
    newUserId: shuffledCustomers[index % shuffledCustomers.length]
  }));
}

function countAssignmentsByUser(assignments) {
  const counts = new Map();
  for (const { newUserId } of assignments) {
    const key = String(newUserId);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

async function up(db) {
  const ordersCol = db.collection('orders');
  const usersCol = db.collection('users');
  const restaurantsCol = db.collection('restaurants');
  const deliverySettingsCol = db.collection('deliverysettings');
  const appSettingsCol = db.collection('appsettings');
  const backupCol = db.collection(BACKUP_COLLECTION);

  const badOrders = await findOrdersWithNonCustomerUser(db);
  if (badOrders.length === 0) {
    console.log('✅ Aucune commande avec un user non-customer');
    return;
  }

  const customers = await usersCol.
  find({ role: 'customer' }).
  project({ _id: 1 }).
  toArray();

  const customerIds = customers.map((customer) => customer._id);
  const assignments = buildCustomerAssignments(badOrders, customerIds);

  const appSettings = await appSettingsCol.findOne({});
  const appDefaultFee = toFiniteNumber(appSettings?.deliveryFee, 2.5);
  const deliverySettings = await deliverySettingsCol.find({}).toArray();
  const deliverySettingByRestaurant = new Map(
    deliverySettings.map((setting) => [String(setting.restaurant), setting])
  );

  for (const { order, newUserId } of assignments) {
    const newUser = await usersCol.findOne(
      { _id: newUserId },
      { projection: { role: 1, address: 1, location: 1 } }
    );

    if (!newUser || newUser.role !== 'customer') {
      continue;
    }

    const restaurant = await restaurantsCol.findOne({ _id: order.restaurant });
    const deliverySetting = deliverySettingByRestaurant.get(String(order.restaurant));

    const resolvedFee = resolveDeliveryFee(
      order,
      deliverySetting,
      restaurant,
      newUser,
      appDefaultFee
    );
    const { subtotal, taxAmount, deliveryFee, totalPrice } = recalculateOrderTotals(
      order,
      resolvedFee
    );

    const deliveryUpdate = {
      ...(order.delivery || {}),
      deliveryFee
    };

    if (order.delivery?.type === 'delivery' && newUser.address) {
      deliveryUpdate.address = newUser.address;
    }

    await backupCol.updateOne(
      { orderId: order._id },
      {
        $set: {
          orderId: order._id,
          previous: {
            user: order.user,
            delivery: order.delivery,
            subtotal: order.subtotal,
            taxAmount: order.tax?.amount,
            totalPrice: order.totalPrice
          },
          nextUserId: newUserId,
          migratedAt: new Date()
        }
      },
      { upsert: true }
    );

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: {
          user: newUserId,
          delivery: deliveryUpdate,
          subtotal,
          'tax.amount': taxAmount,
          totalPrice,
          updatedAt: new Date()
        }
      }
    );
  }

  const distribution = countAssignmentsByUser(assignments);
  const maxPerCustomer = Math.max(...distribution.values());

  console.log(
    `✅ ${assignments.length} commande(s) réassignée(s) à ${distribution.size} customer(s) (max ${maxPerCustomer}/customer)`
  );
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
          user: backup.previous.user,
          delivery: backup.previous.delivery,
          subtotal: backup.previous.subtotal,
          'tax.amount': backup.previous.taxAmount,
          totalPrice: backup.previous.totalPrice,
          updatedAt: new Date()
        }
      }
    );
  }

  await backupCol.deleteMany({});
  console.log(`↩️ ${backups.length} commande(s) restaurée(s)`);
}

module.exports = {
  BACKUP_COLLECTION,
  SHUFFLE_SEED,
  findOrdersWithNonCustomerUser,
  buildCustomerAssignments,
  countAssignmentsByUser,
  up,
  down
};
