/**
 * Prépare le dashboard restaurant demo (demo@restaurant.com).
 * - Aligne users.value du restaurant sur le compte demo
 * - Remonte quelques commandes à aujourd'hui pour les stats "Today"
 *
 * up   → sync lien demo + refresh dates commandes (idempotent)
 * down → restaure users.value + dates sauvegardées
 */

const { ObjectId } = require('mongodb');

const SEED_KEY = 'migration_28_restaurant_demo_dashboard';
const DEMO_EMAIL = 'demo@restaurant.com';
const PREVIOUS_USERS_VALUE = new ObjectId('695d14b658c8996a53b835f1');
const PREVIOUS_USERS_LABEL = 'Arlo Wolff';

async function up(db) {
  const usersCol = db.collection('users');
  const restaurantsCol = db.collection('restaurants');
  const ordersCol = db.collection('orders');
  const now = new Date();

  const demoUser = await usersCol.findOne({ email: DEMO_EMAIL, role: 'restaurant' });
  if (!demoUser?.restaurant) {
    console.log('⚠️ Compte demo restaurant introuvable — migration ignorée');
    return;
  }

  const restaurantId = demoUser.restaurant;
  const restaurant = await restaurantsCol.findOne({ _id: restaurantId });
  if (!restaurant) {
    console.log('⚠️ Restaurant demo introuvable — migration ignorée');
    return;
  }

  if (String(restaurant.users?.value) !== String(demoUser._id)) {
    await restaurantsCol.updateOne(
      { _id: restaurantId },
      {
        $set: {
          users: {
            value: demoUser._id,
            label: demoUser.name || demoUser.email || DEMO_EMAIL,
          },
          updatedAt: now,
        },
      }
    );
    console.log('✅ Restaurant demo lié au compte demo@restaurant.com');
  }

  const candidateOrders = await ordersCol
    .find({ restaurant: restaurantId, status: { $in: ['pending', 'preparing', 'ready', 'delivered'] } })
    .sort({ updatedAt: -1 })
    .limit(4)
    .toArray();

  let refreshed = 0;
  for (let index = 0; index < candidateOrders.length; index += 1) {
    const order = candidateOrders[index];
    if (order.migrationSeedKey === SEED_KEY) {
      continue;
    }

    const createdAt = new Date(now);
    createdAt.setHours(10 + index, 15, 0, 0);

    await ordersCol.updateOne(
      { _id: order._id },
      {
        $set: {
          createdAt,
          updatedAt: now,
          migrationSeedKey: SEED_KEY,
          migrationSeedPreviousCreatedAt: order.createdAt,
        },
      }
    );
    refreshed += 1;
  }

  if (refreshed > 0) {
    console.log(`✅ ${refreshed} commande(s) demo remontée(s) à aujourd'hui`);
  } else {
    console.log('✅ Commandes demo déjà à jour (migration 28)');
  }
}

async function down(db) {
  const usersCol = db.collection('users');
  const restaurantsCol = db.collection('restaurants');
  const ordersCol = db.collection('orders');

  const demoUser = await usersCol.findOne({ email: DEMO_EMAIL, role: 'restaurant' });
  if (demoUser?.restaurant) {
    await restaurantsCol.updateOne(
      { _id: demoUser.restaurant },
      {
        $set: {
          users: {
            value: PREVIOUS_USERS_VALUE,
            label: PREVIOUS_USERS_LABEL,
          },
        },
      }
    );
  }

  const seededOrders = await ordersCol.find({ migrationSeedKey: SEED_KEY }).toArray();
  for (const order of seededOrders) {
    const restore = {
      updatedAt: new Date(),
      migrationSeedKey: '',
      migrationSeedPreviousCreatedAt: '',
    };
    if (order.migrationSeedPreviousCreatedAt) {
      restore.createdAt = order.migrationSeedPreviousCreatedAt;
    }
    await ordersCol.updateOne({ _id: order._id }, { $set: restore, $unset: { migrationSeedKey: '', migrationSeedPreviousCreatedAt: '' } });
  }

  console.log(`↩️ Migration 28 annulée (${seededOrders.length} commande(s) restaurée(s))`);
}

module.exports = {
  SEED_KEY,
  DEMO_EMAIL,
  up,
  down,
};
