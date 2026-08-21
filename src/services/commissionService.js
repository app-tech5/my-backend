const Restaurant = require('../models/Restaurant');
const AppSetting = require('../models/AppSetting');
const { getActiveBenefits } = require('./subscriptionService');

async function getEffectiveCommissionRate(restaurantOrId) {
  let restaurant = restaurantOrId;
  if (!restaurant || !restaurant._id) {
    restaurant = await Restaurant.findById(restaurantOrId).select(
      'commission_rate users'
    );
  }
  if (!restaurant) {
    const settings = await AppSetting.findOne().select('commissionRate');
    return {
      rate: Number(settings?.commissionRate) || 15,
      waived: false,
      reducedBy: 0,
      source: 'default'
    };
  }

  const base = Number(restaurant.commission_rate);
  const settings = await AppSetting.findOne().select('commissionRate');
  const fallback = Number(settings?.commissionRate) || 15;
  const baseRate = Number.isFinite(base) ? base : fallback;

  const ownerId = restaurant.users?.value || restaurant.users;
  if (!ownerId) {
    return { rate: baseRate, waived: false, reducedBy: 0, source: 'restaurant' };
  }

  const benefits = await getActiveBenefits(ownerId, 'restaurant');
  if (!benefits?.active) {
    return { rate: baseRate, waived: false, reducedBy: 0, source: 'restaurant' };
  }

  if (benefits.waiveCommission || benefits.platformAccess) {
    return {
      rate: 0,
      waived: true,
      reducedBy: baseRate,
      source: 'subscription_saas',
      planName: benefits.planName
    };
  }

  const reducedBy = Math.min(
    baseRate,
    Math.max(0, Number(benefits.reducedCommissionPercent) || 0)
  );
  return {
    rate: Math.max(0, baseRate - reducedBy),
    waived: false,
    reducedBy,
    source: reducedBy > 0 ? 'subscription_discount' : 'restaurant',
    planName: benefits.planName
  };
}

function splitOrderAmounts(orderTotal, commissionRatePercent) {
  const total = Number(orderTotal) || 0;
  const rate = Math.max(0, Number(commissionRatePercent) || 0);
  const platform = Math.round(total * rate / 100 * 100) / 100;
  const restaurant = Math.round((total - platform) * 100) / 100;
  return { platform, restaurant, rate };
}

module.exports = {
  getEffectiveCommissionRate,
  splitOrderAmounts
};
