
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("salesreports").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const existingRestaurants = await db.collection('restaurants')
      .find({})
      .project({ _id: 1 })
      .toArray();
    
    const existingAdmins = await db.collection('users')
      .find({ role: 'admin' }) 
      .project({ _id: 1 })
      .toArray();

    if (existingAdmins.length === 0) {
      throw new Error('Aucun utilisateur admin trouvé dans la base de données');
    }
    
    const productCategories = ['Food', 'Drinks', 'Desserts', 'Starters', 'Menus'];
    
    const mockReports = Array.from({ length: 20 }, (_, i) => {
      const startDate = faker.date.past({ years: 1 });
      const endDate = faker.date.between({
        from: startDate,
        to: new Date()
      });
      
      const totalSales = faker.number.float({ min: 1000, max: 50000, precision: 0.01 });
      const totalOrders = faker.number.int({ min: 10, max: 500 });
      const averageOrderValue = totalSales / totalOrders;
      
      const salesByCategory = productCategories.map(category => ({
        category,
        amount: faker.number.float({ min: 100, max: 10000, precision: 0.01 })
      }));

      return {
        restaurant: existingRestaurants.length > 0 
          ? faker.helpers.arrayElement(existingRestaurants)._id 
          : null,
        startDate,
        endDate,
        totalSales,
        totalOrders,
        averageOrderValue,
        salesByCategory,
        deliveryFees: faker.number.float({ min: 50, max: 2000, precision: 0.01 }),
        taxesCollected: faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
        generatedBy: faker.helpers.arrayElement(existingAdmins)._id,
        status: faker.helpers.arrayElement(['pending', 'completed', 'completed', 'completed']), 
        createdAt: faker.date.between({
          from: endDate,
          to: new Date()
        }),
        updatedAt: new Date()
      };
    });
    
    await db.collection('salesreports').insertMany(mockReports);
  },

  async down(db) {
    
    await db.collection('salesreports').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

