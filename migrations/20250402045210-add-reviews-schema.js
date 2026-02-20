
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("reviews").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const [users, restaurants, orders] = await Promise.all([
      db.collection('users').find({}).project({ _id: 1 }).toArray(),
      db.collection('restaurants').find({}).project({ _id: 1 }).toArray(),
      db.collection('orders').find({}).project({ _id: 1 }).toArray()
    ]);

    if (users.length === 0 || restaurants.length === 0) {
      throw new Error('Des collections users et/ou restaurants sont vides');
    }
    
    const mockReviews = Array.from({ length: 100 }, (_, i) => {
      const user = faker.helpers.arrayElement(users);
      const restaurant = faker.helpers.arrayElement(restaurants);
      const order = orders.length > 0 ? faker.helpers.arrayElement(orders) : null;
      const hasComment = faker.datatype.boolean({ probability: 0.8 });
      const hasPhotos = faker.datatype.boolean({ probability: 0.5 });
      const hasReply = faker.datatype.boolean({ probability: 0.3 });
      const status = faker.helpers.weightedArrayElement([
        { value: 'approved', weight: 7 },
        { value: 'pending', weight: 1 },
        { value: 'rejected', weight: 1 },
        { value: 'flagged', weight: 1 }
      ]);

      return {
        user: user._id,
        restaurant: restaurant._id,
        order: order?._id || null,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: hasComment ? faker.lorem.paragraph() : null,
        photos: hasPhotos ? Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
          faker.image.urlLoremFlickr({ category: 'food' })) : [],
        foodQuality: faker.number.int({ min: 1, max: 5 }),
        deliveryTime: faker.number.int({ min: 1, max: 5 }),
        packaging: faker.number.int({ min: 1, max: 5 }),
        deliveryService: faker.number.int({ min: 1, max: 5 }),
        date: faker.date.past({ years: 1 }),
        isAnonymous: faker.datatype.boolean({ probability: 0.2 }),
        reply: hasReply ? {
          text: faker.lorem.sentence(),
          date: faker.date.recent(),
          by: faker.helpers.arrayElement(users)._id
        } : null,
        status: status,
        flaggedReason: status === 'flagged' ? faker.lorem.sentence() : null,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent()
      };
    });

    await db.collection('reviews').insertMany(mockReviews);
  },

  async down(db) {
    
    await db.collection('reviews').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};