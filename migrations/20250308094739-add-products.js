const mongoose = require("mongoose");
module.exports = {
  async up(db, client) {
    // Insérer les éléments de menu dans la collection "products"
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
          {
            name: "Double Steak",
            value: "double_steak",
            label: "Double Steak (+2.00€)",
            price: 10.99,
            extra: 2.00
          },
          {
            name: "Gluten-Free Bun",
            value: "gluten_free_bun",
            label: "Gluten-Free Bun (+0.50€)",
            price: 9.49,
            extra: 0.50
          },
          {
            name: "Extra Bacon",
            value: "extra_bacon",
            label: "Extra Bacon (+1.00€)",
            price: 9.99,
            extra: 1.00
          },
          {
            name: "Extra Cheese",
            value: "extra_cheese",
            label: "Extra Cheese (+0.50€)",
            price: 9.49,
            extra: 0.50
          }
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
          {
            name: "Small",
            value: "small",
            label: "Small (20 cm) - 12.50€",
            price: 12.50,
            size: "20 cm"
          },
          {
            name: "Medium",
            value: "medium",
            label: "Medium (30 cm) - 14.50€",
            price: 14.50,
            size: "30 cm"
          },
          {
            name: "Large",
            value: "large",
            label: "Large (40 cm) - 16.50€",
            price: 16.50,
            size: "40 cm"
          },
          {
            name: "Extra Cheese",
            value: "extra_cheese",
            label: "Extra Cheese (+1.00€)",
            price: 13.50,
            extra: 1.00
          },
          {
            name: "Gluten-Free Dough",
            value: "gluten_free_dough",
            label: "Gluten-Free Dough (+0.50€)",
            price: 13.00,
            extra: 0.50
          },
          {
            name: "Spicy Version (with chili flakes)",
            value: "spicy_version",
            label: "Spicy Version (+0.25€)",
            price: 12.75,
            extra: 0.25
          },
          {
            name: "Extra Basil",
            value: "extra_basil",
            label: "Extra Basil (+0.10€)",
            price: 12.60,
            extra: 0.10
          }
        ],
        created_at: new Date("2024-03-08T10:05:00Z"),
        updated_at: new Date("2024-03-08T10:05:00Z")
      }
    ]);
  },

  async down(db, client) {
    // Supprimer les éléments de menu ajoutés (rollback)
    await db.collection('products').deleteMany({});
  }
};