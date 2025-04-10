// migrations/XXXXXX-generate-mock-subscriptions.js
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("subscriptions").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Récupérer un utilisateur admin existant pour created_by
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    const createdBy = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // Options possibles pour les champs enum
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

    // Générer 10 abonnements aléatoires
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

    // Insérer uniquement les abonnements uniques
    for (const sub of mockSubscriptions) {
      const exists = await db.collection('subscriptions').countDocuments({ name: sub.name });
      if (!exists) {
        await db.collection('subscriptions').insertOne(sub);
      }
    }
  },

  async down(db) {
    // Supprimer les abonnements créés après une date récente
    await db.collection('subscriptions').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

// module.exports = {
//   async up(db, client) {
//     try {
//       await db.collection("subscriptions").drop();
//     } catch (e) {
//       if (e.codeName !== "NamespaceNotFound") throw e;
//     }
//     await db.createCollection('subscriptions');
    
//     const subscriptions = [
//       {
//         name: "Free Delivery+",
//         target: "customer",
//         price: 9.99,
//         currency: "EUR",
//         billing_cycle: "monthly",
//         benefits: [
//           "free_delivery", 
//           "5percent_discount",
//           "priority_support"
//         ],
//         is_active: true,
//         max_usage: null,
//         start_date: new Date(),
//         stripe_id: "price_1P8zXxKb9Ql4XyXJZzXyXyXy",
//         serviceModes: [  // Matching your restaurant example structure
//           { value: "delivery", label: "Delivery" }
//         ]
//       },
//       {
//         name: "Restaurant Premium",
//         target: "restaurant",
//         price: 49.99,
//         currency: "EUR",
//         billing_cycle: "monthly",
//         benefits: [
//           "boosted_visibility",
//           "advanced_analytics",
//           "reduced_commission"
//         ],
//         is_active: true,
//         max_usage: 1000,
//         start_date: new Date(),
//         end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year later
//         coordinates: {  // Matching your restaurant example
//           latitude: 48.8566,
//           longitude: 2.3522 
//         }
//       },
//       {
//         name: "Driver Pro",
//         target: "driver",
//         price: 4.99,
//         currency: "EUR",
//         billing_cycle: "weekly",
//         benefits: [
//           "priority_orders",
//           "health_insurance",
//           "loyalty_bonus"
//         ],
//         is_active: true,
//         start_date: new Date(),
//         review_count: 150,  // Matching your example field
//         rating: 4.7
//       }
//     ];

//     await db.collection('subscriptions').insertMany(subscriptions);

//     // Create optimized indexes
//     await db.collection('subscriptions').createIndex({ target: 1, is_active: 1 });
//     await db.collection('subscriptions').createIndex({ price: 1 });
//   },

//   async down(db, client) {
//     await db.collection('subscriptions').drop();
//   }
// };