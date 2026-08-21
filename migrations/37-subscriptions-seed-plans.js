
module.exports = {
  async up(db) {
    const col = db.collection('subscriptions');
    const existing = await col.countDocuments({});
    if (existing > 0) return;

    const now = new Date();
    await col.insertMany([
    {
      name: 'Good Food Plus',
      target: 'customer',
      price: 4.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: [
      'Free delivery on all orders',
      'Exclusive member deals',
      'Priority support'],

      benefitFlags: {
        freeDelivery: true,
        discountPercent: 0,
        reducedCommissionPercent: 0,
        prioritySupport: true
      },
      is_active: true,
      start_date: now,
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'Restaurant Pro',
      target: 'restaurant',
      price: 29.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: [
      'Lower platform commission',
      'Featured placement opportunities',
      'Priority support'],

      benefitFlags: {
        freeDelivery: false,
        discountPercent: 0,
        reducedCommissionPercent: 5,
        prioritySupport: true
      },
      is_active: true,
      start_date: now,
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'Driver Elite',
      target: 'driver',
      price: 9.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      benefits: [
      'Priority access to high-value jobs',
      'Priority support'],

      benefitFlags: {
        freeDelivery: false,
        discountPercent: 0,
        reducedCommissionPercent: 0,
        prioritySupport: true
      },
      is_active: true,
      start_date: now,
      createdAt: now,
      updatedAt: now
    }]
    );
  },

  async down(db) {
    await db.collection('subscriptions').deleteMany({
      name: { $in: ['Good Food Plus', 'Restaurant Pro', 'Driver Elite'] }
    });
  }
};
