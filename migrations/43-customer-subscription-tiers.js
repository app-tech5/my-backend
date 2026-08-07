/**
 * Seed multiple customer subscription tiers for denser Subscription screenshots.
 */
module.exports = {
  async up(db) {
    const now = new Date();
    const subs = db.collection('subscriptions');

    const plans = [
      {
        name: 'Good Food Plus',
        target: 'customer',
        price: 4.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'Free delivery on eligible orders',
          'Member-only offers',
          'Priority support',
        ],
        benefitFlags: {
          freeDelivery: true,
          discountPercent: 5,
          reducedCommissionPercent: 0,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: true,
        },
        is_active: true,
      },
      {
        name: 'Customer Plus',
        target: 'customer',
        price: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'Free delivery on all orders',
          'Exclusive member deals',
          '5% off food subtotal',
          'Priority support',
        ],
        benefitFlags: {
          freeDelivery: true,
          discountPercent: 5,
          reducedCommissionPercent: 0,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: true,
        },
        is_active: true,
      },
      {
        name: 'Customer Family',
        target: 'customer',
        price: 14.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        benefits: [
          'Free delivery on all orders',
          '10% off food subtotal',
          'Priority support',
          'Early access to flash deals',
        ],
        benefitFlags: {
          freeDelivery: true,
          discountPercent: 10,
          reducedCommissionPercent: 0,
          waiveCommission: false,
          platformAccess: false,
          prioritySupport: true,
        },
        is_active: true,
      },
    ];

    for (const plan of plans) {
      await subs.updateOne(
        { name: plan.name, target: 'customer' },
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
      target: 'customer',
      name: { $in: ['Good Food Plus', 'Customer Family'] },
    });
  },
};
