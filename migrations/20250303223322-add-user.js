const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
// const { ObjectId } = require('mongodb');
const mongoose = require("mongoose");

module.exports = {
  async up(db) {
    try {
      await db.collection("users").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // 1. Ajout de l'utilisateur admin fixe
    const adminUser = {
      _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
      email: "admin@example.com",
      password: "$2a$10$x0Zm/JF2cW/akjwoEpBpvueirfPSdpbyfCVz.UAF6osK9NxN8F1lG", // "admin123"
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

    // 2. Algorithme de génération mock
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

    // 3. Génération des données
    const mockData = [
      ...generateMockUsers(50, 'customer'),
      ...generateMockUsers(20, 'restaurant'), 
      ...generateMockUsers(30, 'delivery')
    ].filter(user => {
      // Garde UNIQUEMENT les URLs contenant jsdelivr.net
      return user.image.includes('jsdelivr.net');

      // const isInvalidAvatar = 
      // user.image.includes('githubusercontent.com') ||
      // user.image.includes('githubassets.com');
      // return !isInvalidAvatar;
    });
    
    // 4. Insertion
    await db.collection('users').insertOne(adminUser);
    await db.collection('users').insertMany(mockData);

    console.log(`Inserted 1 admin + ${mockData.length} mock users`);
  },

  async down(db) {
    // Suppression sélective
    const result = await db.collection('users').deleteMany({
      $or: [
        { email: { $regex: /@mock\.com$/ } },
        { _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6') }
      ]
    });
    console.log(`Deleted ${result.deletedCount} users`);
    return result;
  }
};




// const mongoose = require("mongoose");
// module.exports = {
//   async up(db, client) {
//     const users = [
//       {
//         _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
//         email: "admin@example.com",
//         password: "$2a$10$x0Zm/JF2cW/akjwoEpBpvueirfPSdpbyfCVz.UAF6osK9NxN8F1lG", // Pense à hasher le mot de passe avant
//         name: "User One",
//         phone: "1234567890",
//         image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
//         address: "123 Main Street, New York, NY 10001",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d7'),
//         email: "user2@example.com",
//         password: "hashedpassword2",
//         name: "User Two",
//         phone: "0987654321",
//         image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
//         address: "123 Main Street, New York, NY 10001",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d8'),
//         email: "user3@example.com",
//         password: "hashedpassword3",
//         name: "User Three",
//         phone: "1122334455",
//         image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
//         address: "123 Main Street, New York, NY 10001",
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];

//     await db.collection("users").insertMany(users);
//   },

//   async down(db, client) {
//     await db.collection("users").deleteMany({
//       email: { $in: ["user1@example.com", "user2@example.com", "user3@example.com"] }
//     });
//   }
// };
