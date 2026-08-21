
module.exports = {
  async up(db) {
    const now = new Date();
    const subs = db.collection('subscriptions');

    const saasExists = await subs.findOne({ name: 'Restaurant SaaS Access' });
    if (!saasExists) {
      await subs.insertOne({
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
        is_active: true,
        start_date: now,
        createdAt: now,
        updatedAt: now
      });
    }

    await subs.updateOne(
      { name: 'Restaurant Pro' },
      {
        $set: {
          'benefitFlags.waiveCommission': false,
          'benefitFlags.platformAccess': false,
          benefits: [
          'Lower platform commission',
          'Sponsored listing eligibility',
          'Priority support'],

          updatedAt: now
        }
      }
    );

    const restaurants = await db.
    collection('restaurants').
    find({ isActivated: { $ne: false } }).
    project({ _id: 1, name: 1, image: 1 }).
    limit(3).
    toArray();

    if (restaurants.length) {
      const listings = db.collection('sponsoredlistings');
      const count = await listings.countDocuments({});
      if (count === 0) {
        const startAt = new Date(now.getTime() - 86400000);
        const endAt = new Date(now.getTime() + 30 * 86400000);
        await listings.insertMany(
          restaurants.map((r, idx) => ({
            restaurant: r._id,
            name: `${r.name || 'Restaurant'} Boost`,
            placement: idx === 0 ? 'both' : idx === 1 ? 'home_banner' : 'search',
            status: 'active',
            bidAmount: 15 + idx * 5,
            currency: 'USD',
            dailyBudget: 50,
            priority: 90 - idx * 10,
            headline: idx === 0 ? 'Sponsored · Top pick near you' : 'Featured restaurant',
            image: r.image || '',
            startAt,
            endAt,
            impressions: 0,
            clicks: 0,
            createdAt: now,
            updatedAt: now
          }))
        );
      }
    }
  },

  async down(db) {
    await db.collection('subscriptions').deleteOne({ name: 'Restaurant SaaS Access' });
    await db.collection('sponsoredlistings').deleteMany({
      name: /Boost$/
    });
  }
};
