const Subscription = require('../models/Subscription');
const UserSubscription = require('../models/UserSubscription');
const Transaction = require('../models/Transaction');
const i18n = require('../config/i18n');
const {
  mapRoleToTarget,
  computePeriodEnd,
  serializePlan,
  serializeEnrollment,
  getActiveEnrollment,
  getActiveBenefits,
} = require('../services/subscriptionService');

async function getWalletBalance(userId) {
  const docs = await Transaction.find({
    $or: [{ user: userId }, { userId }],
    status: 'completed',
  }).select('transaction_type payment_method amount status');

  return docs.reduce((acc, doc) => {
    const amount = Number(doc.amount) || 0;
    if (
      doc.transaction_type === 'customer_top_up' ||
      doc.transaction_type === 'refund' ||
      doc.transaction_type === 'adjustment' ||
      doc.transaction_type === 'cashback'
    ) {
      return acc + amount;
    }
    if (
      doc.transaction_type === 'customer_payment' &&
      doc.payment_method === 'platform_credit'
    ) {
      return acc - amount;
    }
    return acc;
  }, 0);
}

exports.listPlans = async (req, res) => {
  try {
    const roleTarget = mapRoleToTarget(req.user.type);
    const target = req.query.target || roleTarget;
    const plans = await Subscription.find({
      is_active: true,
      target,
    }).sort({ price: 1 });

    res.json({
      target,
      plans: plans.map(serializePlan),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || i18n.__('server_error') });
  }
};

exports.getMine = async (req, res) => {
  try {
    const target = mapRoleToTarget(req.user.type);
    const enrollment = await getActiveEnrollment(req.user.id, target);
    const benefits = await getActiveBenefits(req.user.id, target);
    res.json({
      target,
      enrollment: enrollment ? serializeEnrollment(enrollment) : null,
      benefits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || i18n.__('server_error') });
  }
};

exports.getBenefits = async (req, res) => {
  try {
    const target = mapRoleToTarget(req.user.type);
    const benefits = await getActiveBenefits(req.user.id, target);
    res.json(benefits);
  } catch (error) {
    res.status(500).json({ message: error.message || i18n.__('server_error') });
  }
};

exports.subscribe = async (req, res) => {
  try {
    const target = mapRoleToTarget(req.user.type);
    const plan = await Subscription.findById(req.params.id);
    if (!plan || plan.is_active === false) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }
    if (plan.target !== target) {
      return res.status(403).json({ message: 'This plan is not available for your account type' });
    }

    const existing = await getActiveEnrollment(req.user.id, target);
    if (existing) {
      return res.status(409).json({
        message: 'You already have an active subscription',
        enrollment: serializeEnrollment(existing),
      });
    }

    const price = Number(plan.price) || 0;
    let paymentMethod = 'free';

    if (price > 0) {
      if (target === 'customer') {
        const balance = await getWalletBalance(req.user.id);
        if (balance < price) {
          return res.status(402).json({
            message: 'Insufficient wallet balance. Please top up your wallet first.',
            required: price,
            balance,
          });
        }
        await Transaction.create({
          transaction_type: 'customer_payment',
          amount: price,
          currency: (plan.currency || 'USD').toUpperCase() === 'USD' ? 'USD' : 'USD',
          status: 'completed',
          payment_method: 'platform_credit',
          date_completed: new Date(),
          user: req.user.id,
          platform_fee: {
            amount: price,
            description: `Subscription: ${plan.name}`,
          },
        });
        paymentMethod = 'wallet';
      } else {
        await Transaction.create({
          transaction_type: 'service_fee',
          amount: price,
          currency: 'USD',
          status: 'completed',
          date_completed: new Date(),
          user: req.user.id,
          platform_fee: {
            amount: price,
            description: `Subscription: ${plan.name}`,
          },
        });
        paymentMethod = 'manual';
      }
    }

    const now = new Date();
    const enrollment = await UserSubscription.create({
      user: req.user.id,
      subscription: plan._id,
      target,
      status: 'active',
      startedAt: now,
      currentPeriodEnd: computePeriodEnd(now, plan.billing_cycle),
      autoRenew: true,
      paymentMethod,
    });

    await enrollment.populate('subscription');
    res.status(201).json({
      enrollment: serializeEnrollment(enrollment),
      benefits: await getActiveBenefits(req.user.id, target),
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || i18n.__('server_error'),
    });
  }
};

exports.cancelMine = async (req, res) => {
  try {
    const target = mapRoleToTarget(req.user.type);
    const enrollment = await getActiveEnrollment(req.user.id, target);
    if (!enrollment) {
      return res.status(404).json({ message: 'No active subscription to cancel' });
    }

    enrollment.status = 'cancelled';
    enrollment.cancelledAt = new Date();
    enrollment.autoRenew = false;
    // End access immediately for a clear UX
    enrollment.currentPeriodEnd = new Date();
    await enrollment.save();
    await enrollment.populate('subscription');

    res.json({
      enrollment: serializeEnrollment(enrollment),
      benefits: await getActiveBenefits(req.user.id, target),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || i18n.__('server_error') });
  }
};
