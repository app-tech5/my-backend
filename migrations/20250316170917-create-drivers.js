
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db) {
    try {
      await db.collection("drivers").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const existingUsers = await db.collection('users')
      .find({})
      .project({ _id: 1, name: 1 })
      .toArray();

    if (existingUsers.length === 0) {
      throw new Error('No users found in the database');
    }
    
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
    
    await db.collection('drivers').insertMany(mockDrivers);
  },

  async down(db) {
    
    await db.collection('drivers').deleteMany({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }
};

