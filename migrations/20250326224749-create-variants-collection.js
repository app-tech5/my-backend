// migrations/YYYYMMDDHHMMSS-mock-variants.js
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

module.exports = {
  async up(db, client) {

    try {
      await db.collection("variants").drop();
    } catch (e) {
      if (e.codeName !== "NamespaceNotFound") throw e;
    }
    
    const mockVariants = [];
    const variantNames = [
      // Viandes/Protéines
      "Double Steak", 
      "Grilled Chicken",
      "Crispy Chicken",
      "Pulled Pork",
      "Bacon",
      "Pepperoni",
      "Sausage",
      "Tofu",
      "Halloumi",
      "Falafel",
      
      // Fromages
      "Extra Cheese",
      "Mozzarella",
      "Cheddar",
      "Blue Cheese",
      "Feta",
      "Parmesan",
      "Goat Cheese",
      
      // Légumes
      "Avocado",
      "Mushrooms",
      "Roasted Peppers",
      "Grilled Zucchini",
      "Eggplant",
      "Spinach",
      "Arugula",
      "Sun-Dried Tomatoes",
      "Jalapeños",
      "Pickles",
      "Onions",
      "Caramelized Onions",
      
      // Sauces
      "Extra Sauce",
      "BBQ Sauce",
      "Garlic Sauce",
      "Truffle Mayo",
      "Spicy Mayo",
      "Pesto",
      "Tzatziki",
      "Sriracha",
      
      // Options spéciales
      "Spicy",
      "Gluten Free",
      "Vegan Option",
      "Keto Friendly",
      "Low Carb",
      "Dairy Free",
      
      // Tailles
      "Large Size",
      "Mini Size",
      "Family Size",
      
      // Garnitures
      "Fried Egg",
      "Guacamole",
      "Hummus",
      "Olives",
      "Pineapple",
      "Corn",
      "Black Beans",
      
      // Croûtes/Préparations spéciales
      "Whole Wheat",
      "Sourdough",
      "Thin Crust",
      "Deep Dish"
    ];

    // Générer 10 variants mock
    for (let i = 0; i < 50; i++) {
      const basePrice = faker.number.float({ min: 1, max: 15, precision: 0.01 });
      const extraPrice = faker.number.float({ min: 0.5, max: 5, precision: 0.01 });
      
      mockVariants.push({
        name: variantNames[i] || faker.commerce.productAdjective(),
        price: basePrice + extraPrice,
        extra: extraPrice.toFixed(2),
        available: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Insérer les variants dans la base de données
    // await Variant.insertMany(mockVariants);
    await db.collection('variants').insertMany(mockVariants);
    
    console.log(`Inserted ${mockVariants.length} mock variants`);
  },

  async down(db, client) {
    // Supprimer tous les variants créés par cette migration
    await Variant.deleteMany({
      name: { 
        $in: [
          "Double Steak", "Extra Cheese", "Bacon", "Avocado", "Mushrooms",
          "Extra Sauce", "Spicy", "Gluten Free", "Vegan Option", "Large Size"
        ]
      }
    });
    
    console.log('Removed mock variants');
  }
};
// const mongoose = require("mongoose");

// module.exports = {
//   async up(db, client) {
//     await db.collection('variants').insertMany([
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9001"),
//         name: "Double Steak",
//         price: 2.00,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9002"),
//         name: "Gluten-Free Bun",
//         price: 0.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9003"),
//         name: "Extra Bacon",
//         price: 1.00,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9004"),
//         name: "Extra Cheese",
//         price: 0.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9005"),
//         name: "Small (20 cm)",
//         price: 12.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9006"),
//         name: "Medium (30 cm)",
//         price: 14.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9007"),
//         name: "Large (40 cm)",
//         price: 16.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9008"),
//         name: "Extra Cheese",
//         price: 1.00,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9009"),
//         name: "Gluten-Free Dough",
//         price: 0.50,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9010"),
//         name: "Spicy Version",
//         price: 0.25,
//         currency: "EUR"
//       },
//       {
//         _id: new mongoose.Types.ObjectId("67de1a2b3c4d5e6f7a8b9011"),
//         name: "Extra Basil",
//         price: 0.10,
//         currency: "EUR"
//       }
//     ]);
//   },

//   async down(db, client) {
//     await db.collection('variants').deleteMany({});
//   }
// };
