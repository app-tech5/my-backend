
module.exports = {
  async up(db) {
    const now = new Date();
    const subs = db.collection('subscriptions');

    const plans = [
    {
      name: 'Customer Plus',
      target: 'customer',
      price: 9.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: ['Free delivery on eligible orders', 'Member-only offers', 'Priority support'],
      benefitFlags: {
        freeDelivery: true,
        discountPercent: 5,
        reducedCommissionPercent: 0,
        waiveCommission: false,
        platformAccess: false,
        prioritySupport: true
      },
      is_active: true
    },
    {
      name: 'Restaurant Pro',
      target: 'restaurant',
      price: 49,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: [
      'Lower platform commission',
      'Sponsored listing eligibility',
      'Priority support'],

      benefitFlags: {
        freeDelivery: false,
        discountPercent: 0,
        reducedCommissionPercent: 5,
        waiveCommission: false,
        platformAccess: false,
        prioritySupport: true
      },
      is_active: true
    },
    {
      name: 'Restaurant SaaS Access',
      target: 'restaurant',
      price: 99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: [
      'Full platform access for your restaurant',
      'Zero per-order commission while subscribed',
      'Priority support'],

      benefitFlags: {
        freeDelivery: false,
        discountPercent: 0,
        reducedCommissionPercent: 0,
        waiveCommission: true,
        platformAccess: true,
        prioritySupport: true
      },
      is_active: true
    },
    {
      name: 'Driver Priority',
      target: 'driver',
      price: 19.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: ['Priority job offers', 'Lower platform cut', 'Priority support'],
      benefitFlags: {
        freeDelivery: false,
        discountPercent: 0,
        reducedCommissionPercent: 3,
        waiveCommission: false,
        platformAccess: false,
        prioritySupport: true
      },
      is_active: true
    }];

    for (const plan of plans) {
      await subs.updateOne(
        { name: plan.name },
        {
          $set: {
            ...plan,
            start_date: now,
            updatedAt: now
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }

    await subs.updateMany(
      { name: /^Subscription /i },
      { $set: { is_active: false, updatedAt: now } }
    );

    const restaurants = await db.
    collection('restaurants').
    find({ isActivated: { $ne: false } }).
    project({ _id: 1, name: 1, image: 1 }).
    limit(8).
    toArray();

    if (!restaurants.length) return;

    const listings = db.collection('sponsoredlistings');
    const startAt = new Date(now.getTime() - 2 * 86400000);
    const endAt = new Date(now.getTime() + 28 * 86400000);
    const placements = ['search', 'home_banner', 'both', 'search', 'home_banner', 'both', 'search', 'both'];
    const statuses = ['active', 'active', 'active', 'active', 'paused', 'pending_payment', 'active', 'draft'];

    for (let i = 0; i < restaurants.length; i += 1) {
      const r = restaurants[i];
      const name = `${r.name || 'Restaurant'} Boost`;
      await listings.updateOne(
        { name, restaurant: r._id },
        {
          $set: {
            restaurant: r._id,
            name,
            placement: placements[i % placements.length],
            status: statuses[i % statuses.length],
            bidAmount: 12 + i * 4,
            currency: 'USD',
            dailyBudget: 40 + i * 10,
            priority: 95 - i * 8,
            headline:
            i % 2 === 0 ?
            'Sponsored · Top pick near you' :
            'Featured this week',
            image: r.image || '',
            startAt,
            endAt,
            impressions: 120 + i * 85,
            clicks: 8 + i * 5,
            updatedAt: now
          },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }
  },

  async down(db) {
    await db.collection('subscriptions').deleteMany({
      name: {
        $in: [
        'Customer Plus',
        'Restaurant Pro',
        'Restaurant SaaS Access',
        'Driver Priority']

      }
    });
  }
};
