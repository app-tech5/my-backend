
const { ObjectId } = require('mongodb');

const SEED_KEY = 'migration_27_home_marketing';

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function buildPlatformPromotions(createdBy, now) {
  const endDate = addMonths(now, 12);
  return [
  {
    name: '$0 Delivery Fee',
    description: 'Free delivery on your next order with Good Food',
    promotionType: 'free_delivery',
    scope: 'platform',
    applicableRestaurants: [],
    applicableCategories: [],
    applicableItems: [],
    startDate: now,
    endDate,
    isActive: true,
    priority: 10,
    userEligibility: 'all',
    currentUsage: 0,
    createdBy,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  },
  {
    name: '5% off with Good Food',
    description: 'Save on every order this month',
    promotionType: 'percentage_discount',
    discountValue: 5,
    scope: 'platform',
    applicableRestaurants: [],
    applicableCategories: [],
    applicableItems: [],
    startDate: now,
    endDate,
    isActive: true,
    priority: 9,
    userEligibility: 'all',
    currentUsage: 0,
    createdBy,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  },
  {
    name: 'Weekend Flash Deal',
    description: 'Limited-time weekend savings across the marketplace',
    promotionType: 'flash_sale',
    scope: 'platform',
    applicableRestaurants: [],
    applicableCategories: [],
    applicableItems: [],
    startDate: now,
    endDate,
    isActive: true,
    priority: 8,
    userEligibility: 'all',
    currentUsage: 0,
    createdBy,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  }];

}

function buildRestaurantPromotions(restaurants, createdBy, now) {
  const endDate = addMonths(now, 12);
  const labels = ['15% off', 'Hot deal', 'Free item'];

  return restaurants.slice(0, 6).map((restaurant, index) => ({
    name: labels[index % labels.length],
    description: `Special offer at ${restaurant.name}`,
    promotionType: 'percentage_discount',
    discountValue: 10 + index % 3 * 5,
    scope: 'restaurant',
    applicableRestaurants: [restaurant._id],
    applicableCategories: [],
    applicableItems: [],
    startDate: now,
    endDate,
    isActive: true,
    priority: 7,
    userEligibility: 'all',
    currentUsage: 0,
    createdBy,
    migrationSeedKey: SEED_KEY,
    createdAt: now,
    updatedAt: now
  }));
}

async function up(db) {
  const promotionsCol = db.collection('promotions');
  const usersCol = db.collection('users');
  const restaurantsCol = db.collection('restaurants');
  const now = new Date();
  const endDate = addMonths(now, 12);

  const refreshResult = await promotionsCol.updateMany(
    {
      isActive: true,
      endDate: { $lt: now }
    },
    {
      $set: {
        startDate: now,
        endDate,
        updatedAt: now
      }
    }
  );

  if (refreshResult.modifiedCount > 0) {
    console.log(`✅ ${refreshResult.modifiedCount} promotion(s) expirée(s) réactivée(s)`);
  }

  const alreadySeeded = await promotionsCol.countDocuments({ migrationSeedKey: SEED_KEY });
  if (alreadySeeded > 0) {
    console.log('✅ Promotions marketing déjà seedées (migration 27)');
    return;
  }

  const createdByUser =
  (await usersCol.findOne({ role: 'admin' })) || (
  await usersCol.findOne({ role: 'customer' })) || (
  await usersCol.findOne({}));

  if (!createdByUser) {
    console.log('⚠️ Aucun utilisateur trouvé — migration ignorée');
    return;
  }

  const restaurants = await restaurantsCol.find({}).sort({ rating: -1 }).limit(8).toArray();
  if (restaurants.length === 0) {
    console.log('⚠️ Aucun restaurant trouvé — migration ignorée');
    return;
  }

  const docs = [
  ...buildPlatformPromotions(createdByUser._id, now),
  ...buildRestaurantPromotions(restaurants, createdByUser._id, now)];

  await promotionsCol.insertMany(docs);
  console.log(`✅ ${docs.length} promotion(s) marketing seedée(s)`);
}

async function down(db) {
  const promotionsCol = db.collection('promotions');
  const result = await promotionsCol.deleteMany({ migrationSeedKey: SEED_KEY });
  console.log(`↩️ ${result.deletedCount} promotion(s) supprimée(s)`);
}

module.exports = {
  SEED_KEY,
  buildPlatformPromotions,
  buildRestaurantPromotions,
  up,
  down
};
