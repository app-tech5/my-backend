const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const mongoose = require("mongoose");

module.exports = {
  async up(db) {
    try {
      await db.collection("users").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const adminUser = {
      _id: new ObjectId('67c62fae5a9b19466ee230d6'),
      email: "admin@example.com",
      password: "$2a$10$x0Zm/JF2cW/akjwoEpBpvueirfPSdpbyfCVz.UAF6osK9NxN8F1lG", 
      name: "Admin System",
      phone: "+33612345678",
      image: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/41.jpg",
      address: "123 Admin Street, Paris",
      role: "admin",
      isActive: true,
      paymentMethods: [{
        type: "card",
        details: {
          last4: "4242",
          brand: "visa"
        }
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const demoCustomer = {
      _id: new ObjectId('67c62fae5a9b19466ee230d7'),
      email: "demo@customer.com",
      password: bcrypt.hashSync('demo123', 10),
      name: "Demo Customer",
      phone: "+33123456789",
      image: "https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/42.jpg",
      address: "456 Demo Street, Paris",
      role: "customer",
      isActive: true,
      favorites: [],
      paymentMethods: [{
        type: "card",
        details: {
          last4: "1234",
          brand: "mastercard"
        }
      }],
      ratings: { asCustomer: 4.5 },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const generateMockUsers = (count, role) => {
      const users = [];
      const rolesSpecificData = {
        customer: () => ({
          favorites: [],
          paymentMethods: [{
            type: faker.helpers.arrayElement(['card', 'paypal']),
            details: { last4: faker.finance.creditCardNumber().slice(-4) }
          }],
          ratings: { asCustomer: faker.number.float({ min: 1, max: 5, precision: 0.1 }) }
        }),
        restaurant: () => ({
          restaurant: null,
          deliveryZones: [faker.location.city(), faker.location.city()],
          ratings: { asRestaurant: faker.number.float({ min: 1, max: 5, precision: 0.1 }) }
        }),
        delivery: () => ({
          deliveryZones: [faker.location.city(), faker.location.city()],
          isActive: faker.datatype.boolean(),
          ratings: { asDelivery: faker.number.float({ min: 1, max: 5, precision: 0.1 }) },
          vehicleType: faker.helpers.arrayElement(['bike', 'scooter', 'car'])
        })
      };

      for (let i = 0; i < count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const baseUser = {
          email: `${role}+${firstName.toLowerCase()}${i}@mock.com`,
          password: bcrypt.hashSync('password123', 10),
          name: `${firstName} ${lastName}`,
          phone: faker.phone.number(),
          image: faker.image.avatar(),
          address: `${faker.location.streetAddress()}, ${faker.location.city()}`,
          role,
          ...rolesSpecificData[role](),
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent()
        };
        users.push(baseUser);
      }
      return users;
    };
    
    const mockData = [
      ...generateMockUsers(50, 'customer'),
      ...generateMockUsers(20, 'restaurant'), 
      ...generateMockUsers(30, 'delivery')
    ].filter(user => {
      
      return user.image.includes('jsdelivr.net');
      
    });
    
    await db.collection('users').insertOne(adminUser);
    await db.collection('users').insertOne(demoCustomer);
    await db.collection('users').insertMany(mockData);

    console.log(`Inserted 1 admin + 1 demo customer + ${mockData.length} mock users`);
  },

  async down(db) {
    
    const result = await db.collection('users').deleteMany({
      $or: [
        { email: { $regex: /@mock\.com$/ } },
        { email: "demo@customer.com" },
        { _id: new ObjectId('67c62fae5a9b19466ee230d6') }
      ]
    });
    console.log(`Deleted ${result.deletedCount} users`);
    return result;
  }
};

