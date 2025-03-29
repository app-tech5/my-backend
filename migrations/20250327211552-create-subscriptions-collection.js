module.exports = {
  async up(db, client) {
    await db.createCollection('subscriptions');
    
    const subscriptions = [
      {
        name: "Free Delivery+",
        target: "customer",
        price: 9.99,
        currency: "EUR",
        billing_cycle: "monthly",
        benefits: [
          "free_delivery", 
          "5percent_discount",
          "priority_support"
        ],
        is_active: true,
        max_usage: null,
        start_date: new Date(),
        stripe_id: "price_1P8zXxKb9Ql4XyXJZzXyXyXy",
        serviceModes: [  // Matching your restaurant example structure
          { value: "delivery", label: "Delivery" }
        ]
      },
      {
        name: "Restaurant Premium",
        target: "restaurant",
        price: 49.99,
        currency: "EUR",
        billing_cycle: "monthly",
        benefits: [
          "boosted_visibility",
          "advanced_analytics",
          "reduced_commission"
        ],
        is_active: true,
        max_usage: 1000,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year later
        coordinates: {  // Matching your restaurant example
          latitude: 48.8566,
          longitude: 2.3522 
        }
      },
      {
        name: "Driver Pro",
        target: "driver",
        price: 4.99,
        currency: "EUR",
        billing_cycle: "weekly",
        benefits: [
          "priority_orders",
          "health_insurance",
          "loyalty_bonus"
        ],
        is_active: true,
        start_date: new Date(),
        review_count: 150,  // Matching your example field
        rating: 4.7
      }
    ];

    await db.collection('subscriptions').insertMany(subscriptions);

    // Create optimized indexes
    await db.collection('subscriptions').createIndex({ target: 1, is_active: 1 });
    await db.collection('subscriptions').createIndex({ price: 1 });
  },

  async down(db, client) {
    await db.collection('subscriptions').drop();
  }
};