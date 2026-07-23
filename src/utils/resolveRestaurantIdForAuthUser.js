const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

async function resolveRestaurantIdForAuthUser(authUser) {
  if (!authUser || authUser.type !== 'restaurant') {
    return null;
  }

  let restaurantId = authUser.restaurant;
  if (restaurantId && typeof restaurantId === 'object') {
    restaurantId = restaurantId._id || restaurantId.id || null;
  }

  if (!restaurantId) {
    const user = await User.findById(authUser.id).select('restaurant').lean();
    restaurantId = user?.restaurant || null;
  }

  if (!restaurantId) {
    const restaurant = await Restaurant.findOne({ 'users.value': authUser.id }).select('_id').lean();
    restaurantId = restaurant?._id || null;
  }

  return restaurantId;
}

module.exports = { resolveRestaurantIdForAuthUser };
