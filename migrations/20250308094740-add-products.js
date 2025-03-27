const mongoose = require("mongoose");

module.exports = {
  async up(db, client) {
    await db.collection('products').insertMany([
      {
        _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439a'),
        name: "Classic Burger",
        description: "A delicious burger with steak, cheese, and house sauce.",
        price: 8.99,
        currency: "EUR",
        image: "http://localhost:5000/api/uploads/1741850763739.jpg",
        category: new mongoose.Types.ObjectId("67b6d643a2a5d0071e59befe"),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        availability: true,
        preparation_time: 15,
        tags: ["burger", "meat", "fast food"],
        ingredients: [
          "Brioche bun",
          "Ground beef steak",
          "Cheddar cheese",
          "Lettuce",
          "Tomato",
          "House sauce"
        ],
        discount: {
          active: true,
          percentage: 10
        },
        rating: {
          average: 4.5,
          count: 120
        },
        variants: [
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9001"), label: "Double Steak (+2.00€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9002"), label: "Gluten-Free Bun (+0.50€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9003"), label: "Extra Bacon (+1.00€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9004"), label: "Extra Cheese (+0.50€)" }
        ],
        created_at: new Date("2024-03-08T10:00:00Z"),
        updated_at: new Date("2024-03-08T10:00:00Z")
      },
      {
        _id: new mongoose.Types.ObjectId('67cc29e162de2f9a5b4f439b'),
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and fresh basil.",
        price: 12.50,
        currency: "EUR",
        image: "http://localhost:5000/api/uploads/1741851182203.jpg",
        category: new mongoose.Types.ObjectId('67b6d643a2a5d0071e59beff'),
        restaurant: new mongoose.Types.ObjectId("67c69119d778f63b5e5997ca"),
        availability: true,
        preparation_time: 20,
        tags: ["pizza", "Italian", "cheese"],
        ingredients: [
          "Pizza dough",
          "Tomato sauce",
          "Mozzarella",
          "Basil",
          "Olive oil"
        ],
        discount: {
          active: false,
          percentage: 0
        },
        rating: {
          average: 4.7,
          count: 85
        },
        variants: [
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9005"), label: "Small (20 cm) - 12.50€" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9006"), label: "Medium (30 cm) - 14.50€" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9007"), label: "Large (40 cm) - 16.50€" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9008"), label: "Extra Cheese (+1.00€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9009"), label: "Gluten-Free Dough (+0.50€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9010"), label: "Spicy Version (+0.25€)" },
          { value: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9011"), label: "Extra Basil (+0.10€)" }
        ],
        created_at: new Date("2024-03-08T10:05:00Z"),
        updated_at: new Date("2024-03-08T10:05:00Z")
      }
    ]);
  },

  async down(db, client) {
    await db.collection('products').deleteMany({});
  }
};
