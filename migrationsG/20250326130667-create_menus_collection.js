const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
module.exports = {
  async up(db) {
    try {
      await db.collection("menus").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    let mockRestaurants = await db.collection('restaurants').find({}).toArray();
    if (mockRestaurants.length === 0) {
      mockRestaurants = Array.from({ length: 5 }, (_, i) => ({
        _id: new ObjectId(),
        name: faker.company.name(),
        address: faker.location.streetAddress(),
      }));
      await db.collection('restaurants').insertMany(mockRestaurants);
    }
    let mockProducts = await db.collection('products').find({}).toArray();
    if (mockProducts.length === 0) {
      mockProducts = Array.from({ length: 20 }, (_, i) => ({
        _id: new ObjectId(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
      }));
      await db.collection('products').insertMany(mockProducts);
    }
    const mockMenus = Array.from({ length: 30 }, (_, i) => {
      const restaurant = faker.helpers.arrayElement(mockRestaurants);
      const selectedProducts = faker.helpers.arrayElements(
        mockProducts, 
        faker.number.int({ min: 2, max: 8 })
      ).map(product => ({
        value: product._id,
        label: product.name
      }));
      const hasDiscount = faker.datatype.boolean({ probability: 0.3 });
      const ratingAverage = faker.number.float({ min: 1, max: 5, precision: 0.1 });
      const foodImages = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187',
        'https://images.unsplash.com/photo-1482049016688-2d3e1b311543',
      ];
      return {
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        price: parseFloat(faker.commerce.price({ min: 5, max: 50 })),
        image: foodImages[i % foodImages.length], 
        restaurant: restaurant._id,
        restaurants: {
          value: restaurant._id.toString(),
          label: restaurant.name
        },
        availability: faker.datatype.boolean({ probability: 0.8 }),
        preparation_time: faker.number.int({ min: 10, max: 60 }),
        products: selectedProducts,
        discount: {
          active: hasDiscount,
          percentage: hasDiscount ? faker.number.int({ min: 5, max: 30 }) : 0
        },
        rating: {
          average: ratingAverage,
          count: faker.number.int({ min: 0, max: 100 })
        },
        created_at: faker.date.past({ years: 1 }),
        updated_at: faker.date.recent({ days: 30 }),
      };
    });
    await db.collection('menus').insertMany(mockMenus);
  },
  async down(db) {
    await db.collection('menus').deleteMany({});
  }
};
