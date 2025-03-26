const mongoose = require("mongoose");
module.exports = {
  async up(db) {
    // Insert drivers into the `drivers` collection
    await db.collection('drivers').insertMany([
      {
        userId: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"), // Reference to an existing user
        vehicle: {
          type: "scooter",
          model: "Yamaha NMAX",
          licensePlate: "AB-123-CD",
        },
        location: {
          type: "Point",
          coordinates: [2.3522, 48.8566], // Coordinates of Paris
        },
        status: "available",
        rating: 4.7,
        totalDeliveries: 120,
        documents: [
          {
            type: "driver's license",
            fileUrl: "https://example.com/documents/license-john-doe.pdf",
          },
        ],
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"), // Reference to another user
        vehicle: {
          type: "car",
          model: "Toyota Corolla",
          licensePlate: "EF-456-GH",
        },
        location: {
          type: "Point",
          coordinates: [2.3333, 48.8667], // Coordinates near Paris
        },
        status: "on_delivery",
        rating: 4.5,
        totalDeliveries: 95,
        documents: [
          {
            type: "driver's license",
            fileUrl: "https://example.com/documents/license-jane-smith.pdf",
          },
        ],
        isApproved: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(db) {
    // Remove the inserted drivers (rollback)
    await db.collection('drivers').deleteMany({
      userId: {
        $in: [
          new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d7"),
          new mongoose.Types.ObjectId("67c62fae5a9b19466ee230d8"),
        ],
      },
    });
  },
};