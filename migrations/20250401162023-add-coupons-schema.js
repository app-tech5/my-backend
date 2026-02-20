
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("coupons").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const [restaurants, users] = await Promise.all([
      db.collection('restaurants').find({}).project({ _id: 1 }).toArray(),
      db.collection('users').find({}).project({ _id: 1 }).limit(5).toArray()
    ]);

    if (restaurants.length === 0 || users.length === 0) {
      throw new Error('Des collections restaurants ou users sont vides');
    }
    
    const categories = ['pizza', 'burger', 'sushi', 'dessert', 'boisson', 'asiatique', 'italien'];
    
    const mockCoupons = Array.from({ length: 20 }, (_, i) => {
      const discountType = faker.helpers.arrayElement(['percentage', 'fixed', 'free_delivery']);
      const startDate = faker.date.past({ years: 0.5 });
      const endDate = faker.date.future({ years: 0.5, refDate: startDate });
      const isPublic = faker.datatype.boolean({ probability: 0.7 });
      const hasMinOrder = faker.datatype.boolean({ probability: 0.5 });
      const hasMaxUses = faker.datatype.boolean({ probability: 0.6 });

      return {
        code: `PROMO${faker.string.alphanumeric(5).toUpperCase()}`,
        description: faker.helpers.arrayElement([
          'Réduction spéciale',
          'Offre limitée',
          'Promotion été 2023',
          'Première commande',
          null
        ]),
        discountType,
        discountValue: discountType !== 'free_delivery' 
          ? discountType === 'percentage' 
            ? faker.number.int({ min: 5, max: 30 }) 
            : faker.number.int({ min: 5, max: 15 })
          : undefined,
        minOrderAmount: hasMinOrder ? faker.number.int({ min: 15, max: 50 }) : undefined,
        applicableRestaurants: faker.helpers.arrayElements(
          restaurants, 
          faker.number.int({ min: 1, max: 3 })
        ).map(r => r._id),
        applicableCategories: faker.helpers.arrayElements(
          categories,
          faker.number.int({ min: 1, max: 3 })
        ),
        startDate,
        endDate,
        maxUses: hasMaxUses ? faker.number.int({ min: 10, max: 100 }) : undefined,
        currentUses: 0,
        userUsageLimit: faker.helpers.arrayElement([1, 1, 1, 2, 3]),
        isPublic,
        targetedUsers: isPublic ? [] : faker.helpers.arrayElements(
          users, 
          faker.number.int({ min: 1, max: 3 })
        ).map(u => u._id),
        firstOrderOnly: faker.datatype.boolean({ probability: 0.2 }),
        createdBy: faker.helpers.arrayElement(users)._id,
        isActive: faker.datatype.boolean({ probability: 0.8 }),
        createdAt: faker.date.past({ years: 0.2 }),
        updatedAt: faker.date.recent()
      };
    });
    
    const codes = new Set();
    for (const coupon of mockCoupons) {
      if (codes.has(coupon.code)) {
        coupon.code = `PROMO${faker.string.alphanumeric(5).toUpperCase()}`;
      }
      codes.add(coupon.code);
    }
    
    await db.collection('coupons').insertMany(mockCoupons);
  },

  async down(db) {
    
    await db.collection('coupons').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};