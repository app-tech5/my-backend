// migrations/XXXXXX-generate-mock-drivers.js

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("drivers").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    // Get existing users
    const existingUsers = await db.collection('users')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingUsers.length === 0) {
      throw new Error('No users found in the database');
    }

    // Generate mock drivers
    const mockDrivers = Array.from({ length: 40 }, (_, i) => {
      const user = faker.helpers.arrayElement(existingUsers);
      const vehicleTypes = ['scooter', 'car', 'motorcycle', 'bicycle'];
      const statuses = ['available', 'on_delivery', 'offline'];
      
      return {
        userId: user._id,
        licenseNumber: `LIC${faker.string.alphanumeric(10).toUpperCase()}`,
        users: {
          value: user._id.toString(),
          label: user.name || faker.person.fullName()
        },
        vehicle: {
          type: faker.helpers.arrayElement(vehicleTypes),
          model: faker.vehicle.model(),
          licensePlate: faker.vehicle.vrm()
        },
        location: {
          type: "Point",
          coordinates: [
            faker.location.longitude(),
            faker.location.latitude()
          ]
        },
        status: faker.helpers.arrayElement(statuses),
        rating: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
        totalDeliveries: faker.number.int({ min: 0, max: 500 }),
        documents: [
          {
            type: "driver's license",
            fileUrl: faker.image.urlLoremFlickr({ category: 'document' })
          },
          {
            type: "vehicle insurance",
            fileUrl: faker.image.urlLoremFlickr({ category: 'document' })
          }
        ],
        isApproved: faker.datatype.boolean({ probability: 0.7 }),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 })
      };
    });

    // Insert drivers into the database
    await db.collection('drivers').insertMany(mockDrivers);
  },

  async down(db) {
    // Delete only the generated drivers (identified by recent created_at)
    await db.collection('drivers').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};
// const mongoose = require("mongoose");
// module.exports = {
//   async up(db) {
//     // Insert drivers into the `drivers` collection
//     await db.collection('drivers').insertMany([
//       {
//         userId: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"), // Reference to an existing user
//         vehicle: {
//           type: "scooter",
//           model: "Yamaha NMAX",
//           licensePlate: "AB-123-CD",
//         },
//         location: {
//           type: "Point",
//           coordinates: [2.3522, 48.8566], // Coordinates of Paris
//         },
//         status: "available",
//         rating: 4.7,
//         totalDeliveries: 120,
//         documents: [
//           {
//             type: "driver's license",
//             fileUrl: "https://example.com/documents/license-john-doe.pdf",
//           },
//         ],
//         isApproved: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       {
//         userId: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"), // Reference to another user
//         vehicle: {
//           type: "car",
//           model: "Toyota Corolla",
//           licensePlate: "EF-456-GH",
//         },
//         location: {
//           type: "Point",
//           coordinates: [2.3333, 48.8667], // Coordinates near Paris
//         },
//         status: "on_delivery",
//         rating: 4.5,
//         totalDeliveries: 95,
//         documents: [
//           {
//             type: "driver's license",
//             fileUrl: "https://example.com/documents/license-jane-smith.pdf",
//           },
//         ],
//         isApproved: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     ]);
//   },

//   async down(db) {
//     // Remove the inserted drivers (rollback)
//     await db.collection('drivers').deleteMany({
//       userId: {
//         $in: [
//           new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
//           new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"),
//         ],
//       },
//     });
//   },
// };