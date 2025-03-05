module.exports = {
  async up(db, client) {
    const users = [
      {
        email: "admin@example.com",
        password: "$2a$10$x0Zm/JF2cW/akjwoEpBpvueirfPSdpbyfCVz.UAF6osK9NxN8F1lG", // Pense à hasher le mot de passe avant
        name: "User One",
        phone: "1234567890",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "user2@example.com",
        password: "hashedpassword2",
        name: "User Two",
        phone: "0987654321",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: "user3@example.com",
        password: "hashedpassword3",
        name: "User Three",
        phone: "1122334455",
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
