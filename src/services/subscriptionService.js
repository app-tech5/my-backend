const UserSubscription = require('../models/UserSubscription');
const Subscription = require('../models/Subscription');

function mapRoleToTarget(role) {
  if (role === 'delivery' || role === 'driver') return 'driver';
  if (role === 'restaurant') return 'restaurant';
  return 'customer';
}

function computePeriodEnd(fromDate, billingCycle) {
  const end = new Date(fromDate);
  switch (billingCycle) {
    case 'daily':
      end.setDate(end.getDate() + 1);
      break;
    case 'weekly':
      end.setDate(end.getDate() + 7);
      break;
    case 'yearly':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

function serializePlan(plan) {
  return {
    id: String(plan._id),
    name: plan.name,
    target: plan.target,
    price: Number(plan.price) || 0,
    currency: plan.currency || 'USD',
    billingCycle: plan.billing_cycle || 'monthly',
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    benefitFlags: {
      freeDelivery: !!plan.benefitFlags?.freeDelivery,
      discountPercent: Number(plan.benefitFlags?.discountPercent) || 0,
      reducedCommissionPercent: Number(plan.benefitFlags?.reducedCommissionPercent) || 0,
      waiveCommission: !!plan.benefitFlags?.waiveCommission,
      platformAccess: !!plan.benefitFlags?.platformAccess,
      prioritySupport: !!plan.benefitFlags?.prioritySupport,
    },
    isActive: plan.is_active !== false,
  };
}

function serializeEnrollment(enrollment) {
  const plan = enrollment.subscription;
  return {
    id: String(enrollment._id),
    status: enrollment.status,
    target: enrollment.target,
    startedAt: enrollment.startedAt,
    currentPeriodEnd: enrollment.currentPeriodEnd,
    cancelledAt: enrollment.cancelledAt || null,
    autoRenew: !!enrollment.autoRenew,
    paymentMethod: enrollment.paymentMethod,
    plan: plan && plan._id ? serializePlan(plan) : { id: String(enrollment.subscription) },
  };
}

async function getActiveEnrollment(userId, target) {
  const now = new Date();
  const enrollment = await UserSubscription.findOne({
    user: userId,
    status: 'active',
    ...(target ? { target } : {}),
    currentPeriodEnd: { $gt: now },
  })
    .sort({ currentPeriodEnd: -1 })
    .populate('subscription');

  if (!enrollment) return null;

  if (enrollment.subscription && enrollment.subscription.is_active === false) {
    return null;
  }

  return enrollment;
}

async function getActiveBenefits(userId, target) {
  const enrollment = await getActiveEnrollment(userId, target);
  if (!enrollment?.subscription) {
    return {
      active: false,
      freeDelivery: false,
      discountPercent: 0,
      reducedCommissionPercent: 0,
      waiveCommission: false,
      platformAccess: false,
      prioritySupport: false,
      planName: null,
      currentPeriodEnd: null,
    };
  }
  const plan = enrollment.subscription;
  return {
    active: true,
    freeDelivery: !!plan.benefitFlags?.freeDelivery,
    discountPercent: Number(plan.benefitFlags?.discountPercent) || 0,
    reducedCommissionPercent: Number(plan.benefitFlags?.reducedCommissionPercent) || 0,
    waiveCommission: !!plan.benefitFlags?.waiveCommission,
    platformAccess: !!plan.benefitFlags?.platformAccess,
    prioritySupport: !!plan.benefitFlags?.prioritySupport,
    planName: plan.name,
    currentPeriodEnd: enrollment.currentPeriodEnd,
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
  };
}

module.exports = {
  mapRoleToTarget,
  computePeriodEnd,
  serializePlan,
  serializeEnrollment,
  getActiveEnrollment,
  getActiveBenefits,
};
