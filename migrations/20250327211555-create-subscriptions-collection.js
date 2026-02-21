const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
module.exports = {
  async up(db) {
    try {
      await db.collection("subscriptions").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : new ObjectId();
    const TARGETS = ['customer', 'restaurant', 'driver'];
    const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'yearly'];
    const SERVICE_MODES = [
      { value: 'delivery', label: 'Delivery' },
      { value: 'pickup', label: 'Pickup' },
      { value: 'dinein', label: 'Dine-in' }
    ];
    const BENEFITS = [
      "Exclusive discounts",
      "Free delivery",
      "Priority access",
      "Premium support",
      "Advanced statistics"
    ];
    const mockSubscriptions = Array.from({ length: 10 }, (_, i) => {
      const target = faker.helpers.arrayElement(TARGETS);
      const billingCycle = faker.helpers.arrayElement(BILLING_CYCLES);
      const serviceModes = faker.helpers.arrayElements(
        SERVICE_MODES,
        faker.number.int({ min: 1, max: 3 })
      );
      return {
        name: `Subscription ${faker.word.adjective()} ${faker.word.noun()}`,
        target,
        price: faker.number.float({ min: 5, max: 100, precision: 0.01 }),
        currency: faker.finance.currencyCode(),
        billing_cycle: billingCycle,
        benefits: faker.helpers.arrayElements(
          BENEFITS,
          faker.number.int({ min: 1, max: 3 })
        ),
        is_active: faker.datatype.boolean({ probability: 0.8 }),
        start_date: faker.date.past(),
        end_date: faker.datatype.boolean({ probability: 0.3 }) 
          ? faker.date.future() 
          : null,
        max_usage: faker.datatype.boolean({ probability: 0.5 })
          ? faker.number.int({ min: 10, max: 100 })
          : null,
        serviceModes,
        stripe_id: faker.datatype.boolean({ probability: 0.7 })
          ? `plan_${faker.string.alphanumeric(14)}`
          : null,
        created_by: createdBy,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent()
      };
    });
    for (const sub of mockSubscriptions) {
      const exists = await db.collection('subscriptions').countDocuments({ name: sub.name });
      if (!exists) {
        await db.collection('subscriptions').insertOne(sub);
      }
    }
  },
  async down(db) {
    await db.collection('subscriptions').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
