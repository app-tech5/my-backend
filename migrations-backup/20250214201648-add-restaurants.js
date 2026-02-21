const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const RESTAURANT_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
  'https://images.unsplash.com/photo-1581349485608-9469926a8e5e',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b'
];
module.exports = {
  async up(db) {
    try {
      await db.collection("restaurants").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    const categories = await db.collection('categories').find({}).project({ _id: 1, title: 1 }).toArray();
    const taxes = await db.collection('taxes').find({}).project({ _id: 1, name: 1, rate: 1 }).toArray();
    const users = await db.collection('users').find({}).project({ _id: 1, name: 1 }).toArray();
    if (!categories.length || !taxes.length || !users.length) {
      console.warn('⚠️  Avertissement : les collections categories, taxes ou users sont vides.');
      return;
    }
    const mockRestaurants = Array.from({ length: 20 }, (_, i) => {
      const selectedCategories = faker.helpers.arrayElements(
        categories,
        faker.number.int({ min: 1, max: 3 })
      ).map(cat => ({
        alias: faker.lorem.slug(),
        title: cat.title,
        image: faker.image.urlLoremFlickr({ category: 'food' }),
        value: cat._id,
        label: cat.title
      }));
      const tax = faker.helpers.arrayElement(taxes);
      const city = faker.location.city();
      const isClosed = faker.datatype.boolean({ probability: 0.1 });
      const priceLevel = faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']);
      const user = faker.helpers.arrayElement(users);
      const restaurantImage = faker.helpers.arrayElement(RESTAURANT_IMAGES);
      return {
        name: faker.company.name(),
        alias: faker.lorem.slug(),
        id: faker.string.uuid(),
        description: faker.lorem.paragraph(),
        distance: faker.number.float({ min: 0.1, max: 15, precision: 0.1 }),
        rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        review_count: faker.number.int({ min: 0, max: 500 }),
        url: faker.internet.url(),
        display_phone: faker.phone.number(),
        phone: faker.phone.number(),
        price: priceLevel,
        is_closed: isClosed,
        isAvailableForDelivery: !isClosed && faker.datatype.boolean({ probability: 0.8 }),
        isActivated: faker.datatype.boolean({ probability: 0.9 }),
        image_url: restaurantImage + '?w=800&h=600&auto=format&fit=crop',
        image: restaurantImage + '?w=800&h=600&auto=format&fit=crop',
        theme: faker.helpers.arrayElement(['default', 'modern', 'classic']),
        country: faker.location.country(),
        city: city,
        address: `${faker.location.streetAddress()}, ${city}`,
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        serviceModes: faker.helpers.arrayElement(["delivery", "pickup"]), 
        categories: selectedCategories,
        collectTime: faker.number.int({ min: 10, max: 45 }),
        openingTime: `${faker.number.int({ min: 6, max: 9 })}:00`,
        closingTime: `${faker.number.int({ min: 20, max: 23 })}:00`,
        deliveryOptions: {
          deliveryType: faker.helpers.arrayElement(['standard', 'express', 'scheduled']),
          isDeliveryAvailable: faker.datatype.boolean({ probability: 0.8 }),
          isOrderAmountBasedFee: faker.datatype.boolean(),
          fixedFee: faker.number.float({ min: 1, max: 5, precision: 0.5 }),
          distanceFee: {
            base: faker.number.float({ min: 1, max: 3, precision: 0.5 }).toFixed(2),
            perKm: faker.number.float({ min: 0.2, max: 1.5, precision: 0.1 }).toFixed(2)
          },
          isFreeDelivery: {
            enabled: faker.datatype.boolean({ probability: 0.3 })
          },
          orderAmountThreshold: faker.number.int({ min: 15, max: 50 })
        },
        tax: {
          id: tax._id,
          location: city,
          rate: tax.rate,
          name: tax.name,
          value: tax._id,
          label: tax.name
        },
        commission_rate: faker.number.float({ min: 0, max: 15, precision: 0.5 }),
        reward: faker.lorem.words(3),
        createdAt: faker.date.past({ years: 1 }),
        users: {
          value: user._id,
          label: user.name || faker.person.fullName()
        }
      };
    });
    await db.collection('restaurants').insertMany(mockRestaurants);
  },
  async down(db) {
    await db.collection('restaurants').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
