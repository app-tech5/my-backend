/**
 * Seed multiple driver subscription tiers so the driver app Subscription
 * screen is not a single sparse card (screenshot / demo density).
 */
module.exports = {
  async up(db) {
    const now = new Date();
    const subs = db.collection('subscriptions');

    const plans = [
      {
        name: 'Driver Starter',
        target: 'driver',
        price: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'Access to standard job offers',
          'In-app navigation',
          'Basic support',
        ],
        benefitFlags: {
          freeDelivery: false,
          discountPercent: 0,
          reducedCommissionPercent: 0,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: false,
        },
        is_active: true,
      },
      {
        name: 'Driver Priority',
        target: 'driver',
        price: 19.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'Priority job offers',
          'Lower platform cut',
          'Priority support',
        ],
        benefitFlags: {
          freeDelivery: false,
          discountPercent: 0,
          reducedCommissionPercent: 3,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: true,
        },
        is_active: true,
      },
      {
        name: 'Driver Elite',
        target: 'driver',
        price: 34.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'First access to high-value jobs',
          'Lowest platform cut',
          'Dedicated priority support',
          'Weekly earnings bonus eligibility',
        ],
        benefitFlags: {
          freeDelivery: false,
          discountPercent: 0,
          reducedCommissionPercent: 6,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: true,
        },
        is_active: true,
      },
    ];

    for (const plan of plans) {
      await subs.updateOne(
        { name: plan.name, target: 'driver' },
        {
          $set: {
            ...plan,
            start_date: now,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }
  },

  async down(db) {
    await db.collection('subscriptions').deleteMany({
      target: 'driver',
      name: { $in: ['Driver Starter', 'Driver Elite'] },
    });
  },
};
