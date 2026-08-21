
const {
  toFiniteNumber,
  resolveDeliveryFee,
  recalculateOrderTotals
} = require('./16-orders-fix-absurd-delivery-fees');

const {
  PARIS_USER_LOCATIONS,
  hasValidLocation,
  seededShuffle,
  generateParisLocation
} = require('./19-users-backfill-paris-locations');

const USER_BACKUP_COLLECTION = '_migration_22_user_location_fix_backups';
const ORDER_BACKUP_COLLECTION = '_migration_22_order_delivery_fee_backups';
const SHUFFLE_SEED = 20260622;

const PARIS_LAT_MIN = 48.81;
const PARIS_LAT_MAX = 48.91;
const PARIS_LON_MIN = 2.25;
const PARIS_LON_MAX = 2.422;

function locationKey(spot) {
  return `${spot.latitude.toFixed(6)}:${spot.longitude.toFixed(6)}`;
}

function isBadParisBackfillLocation(user) {
  if (!hasValidLocation(user)) {
    return false;
  }

  const { address = '', location } = user;
  const { latitude: lat, longitude: lon } = location;

  if (address.includes('undefined') || /750[2-9]\d/.test(address)) {
    return true;
  }

  if (lat > PARIS_LAT_MAX || lat < PARIS_LAT_MIN) {
    return true;
  }

  if (lon > PARIS_LON_MAX || lon < PARIS_LON_MIN) {
    return true;
  }

  return false;
}

function pickDistinctParisSpots(count, usedKeys, seed = SHUFFLE_SEED) {
  const used = new Set(usedKeys);
  const pool = [];

  const addSpot = (spot) => {
    const key = locationKey(spot);
    if (used.has(key)) {
      return false;
    }
    used.add(key);
    pool.push(spot);
    return true;
  };

  seededShuffle(PARIS_USER_LOCATIONS, seed).forEach((spot) => {
    if (pool.length < count) {
      addSpot(spot);
    }
  });

  let slot = 0;
  while (pool.length < count) {
    addSpot(generateParisLocation(slot, seed + 99));
    slot += 1;
  }

  return seededShuffle(pool, seed + 1).slice(0, count);
}

async function recalculateOrdersForUsers(db, userIds) {
  if (userIds.length === 0) {
    return 0;
  }

  const ordersCol = db.collection('orders');
  const restaurantsCol = db.collection('restaurants');
  const usersCol = db.collection('users');
  const deliverySettingsCol = db.collection('deliverysettings');
  const appSettingsCol = db.collection('appsettings');
  const backupCol = db.collection(ORDER_BACKUP_COLLECTION);

  const appSettings = await appSettingsCol.findOne({});
  const appDefaultFee = toFiniteNumber(appSettings?.deliveryFee, 2.5);

  const deliverySettings = await deliverySettingsCol.find({}).toArray();
  const deliverySettingByRestaurant = new Map(
    deliverySettings.map((setting) => [String(setting.restaurant), setting])
  );

  const orders = await ordersCol.
  find({
    user: { $in: userIds },
    'delivery.type': 'delivery'
  }).
  toArray();

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

    const current = toFiniteNumber(order?.delivery?.deliveryFee, 0);
    if (Math.abs(current - resolvedFee) <= 0.01) {
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
            totalPrice: order.totalPrice
          },
          migratedAt: new Date()
        }
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
          updatedAt: new Date()
        }
      }
    );

    updatedCount += 1;
  }

  return updatedCount;
}

async function up(db) {
  const usersCol = db.collection('users');
  const backupCol = db.collection(USER_BACKUP_COLLECTION);

  const allUsers = await usersCol.
  find({ role: { $ne: 'admin' } }).
  sort({ _id: 1 }).
  toArray();

  const badUsers = allUsers.filter(isBadParisBackfillLocation);

  if (badUsers.length === 0) {
    console.log('✅ Aucun user avec location Paris invalide (migration 19)');
    return;
  }

  const badUserIds = new Set(badUsers.map((user) => String(user._id)));
  const usedKeys = new Set();

  allUsers.forEach((user) => {
    if (badUserIds.has(String(user._id)) || !hasValidLocation(user)) {
      return;
    }
    usedKeys.add(locationKey(user.location));
  });

  const spots = pickDistinctParisSpots(badUsers.length, usedKeys);

  for (let index = 0; index < badUsers.length; index += 1) {
    const user = badUsers[index];
    const spot = spots[index];

    await backupCol.updateOne(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          previous: {
            address: user.address ?? '',
            location: user.location ?? null
          },
          next: {
            address: spot.address,
            location: {
              latitude: spot.latitude,
              longitude: spot.longitude
            }
          },
          migratedAt: new Date()
        }
      },
      { upsert: true }
    );

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          address: spot.address,
          location: {
            latitude: spot.latitude,
            longitude: spot.longitude
          }
        }
      }
    );
  }

  const orderUpdates = await recalculateOrdersForUsers(
    db,
    badUsers.map((user) => user._id)
  );

  console.log(
    `✅ ${badUsers.length} user(s) corrigé(s), ${orderUpdates} commande(s) delivery fee recalculée(s)`
  );
}

async function down(db) {
  const usersCol = db.collection('users');
  const userBackupCol = db.collection(USER_BACKUP_COLLECTION);
  const orderBackupCol = db.collection(ORDER_BACKUP_COLLECTION);
  const ordersCol = db.collection('orders');

  const userBackups = await userBackupCol.find({}).toArray();

  for (const backup of userBackups) {
    await usersCol.updateOne(
      { _id: backup.userId },
      {
        $set: {
          address: backup.previous.address,
          location: backup.previous.location
        }
      }
    );
  }

  const orderBackups = await orderBackupCol.find({}).toArray();

  for (const backup of orderBackups) {
    await ordersCol.updateOne(
      { _id: backup.orderId },
      {
        $set: {
          subtotal: backup.previous.subtotal,
          'tax.amount': backup.previous.taxAmount,
          'delivery.deliveryFee': backup.previous.deliveryFee,
          totalPrice: backup.previous.totalPrice,
          updatedAt: new Date()
        }
      }
    );
  }

  await userBackupCol.deleteMany({});
  await orderBackupCol.deleteMany({});

  console.log(
    `↩️ ${userBackups.length} user(s) et ${orderBackups.length} commande(s) restauré(s)`
  );
}

module.exports = {
  USER_BACKUP_COLLECTION,
  ORDER_BACKUP_COLLECTION,
  SHUFFLE_SEED,
  PARIS_LAT_MIN,
  PARIS_LAT_MAX,
  PARIS_LON_MIN,
  PARIS_LON_MAX,
  isBadParisBackfillLocation,
  pickDistinctParisSpots,
  up,
  down
};
