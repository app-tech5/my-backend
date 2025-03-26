const mongoose = require("mongoose");
module.exports = {
  async up(db, client) {
    const users = [
      {
        _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d6'),
        email: "admin@example.com",
        password: "$2a$10$x0Zm/JF2cW/akjwoEpBpvueirfPSdpbyfCVz.UAF6osK9NxN8F1lG", // Pense à hasher le mot de passe avant
        name: "User One",
        phone: "1234567890",
        image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
        address: "123 Main Street, New York, NY 10001",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d7'),
        email: "user2@example.com",
        password: "hashedpassword2",
        name: "User Two",
        phone: "0987654321",
        image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
        address: "123 Main Street, New York, NY 10001",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('67c62fae5a9b19466ee230d8'),
        email: "user3@example.com",
        password: "hashedpassword3",
        name: "User Three",
        phone: "1122334455",
        image: "https://icon-library.com/images/profile-picture-icon/profile-picture-icon-10.jpg",
        address: "123 Main Street, New York, NY 10001",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.collection("users").insertMany(users);
  },

  async down(db, client) {
    await db.collection("users").deleteMany({
      email: { $in: ["user1@example.com", "user2@example.com", "user3@example.com"] }
    });
  }
};
